import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';
import { DOMParser } from 'xmldom';
@Injectable()
export class BookingService {
  private readonly xmlFolder = path.join(__dirname, '..', '..', 'xml');

  constructor() {
    if (!fs.existsSync(this.xmlFolder)) {
      fs.mkdirSync(this.xmlFolder);
    }
  }

  async parseXmlFileWithLib(filePath: string): Promise<any> {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      explicitRoot: false,
    });
    return new Promise((resolve, reject) => {
      parser.parseString(fileContent, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  async parseXmlFileWithoutLib(filePath: string): Promise<any> {
    // Read the XML file content
    const xmlStr = fs.readFileSync(filePath, 'utf-8');

    // Create a DOMParser and parse the XML string
    const parser = new DOMParser();
    const srcDOM = parser.parseFromString(xmlStr, 'text/xml');

    // Function to recursively parse XML nodes
    function parseXmlFromFile(node: Element): any {
      if (node.nodeType === node.TEXT_NODE) {
        const trimmedValue = node.nodeValue?.trim();
        return trimmedValue === '' ? undefined : trimmedValue;
      }

      const json: any = {};
      if (node.nodeType === node.ELEMENT_NODE) {
        const element = node as Element;

        // Collect attributes
        const attributes: any = {};
        if (element.attributes && element.attributes.length > 0) {
          for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes.item(i);
            if (attr) {
              attributes[attr.nodeName] = attr.nodeValue;
            }
          }
        }

        // Handle children
        if (element.hasChildNodes()) {
          const children = Array.from(element.childNodes);
          children.forEach((child) => {
            if (child.nodeType === node.ELEMENT_NODE) {
              const childJson = parseXmlFromFile(child as Element);
              const nodeName = child.nodeName;
              if (json[nodeName]) {
                if (Array.isArray(json[nodeName])) {
                  json[nodeName].push(childJson);
                } else {
                  json[nodeName] = [json[nodeName], childJson];
                }
              } else {
                json[nodeName] = childJson;
              }
            } else if (child.nodeType === node.TEXT_NODE) {
              const textValue = parseXmlFromFile(child as Element);
              if (textValue !== undefined) {
                json['_'] = textValue;
              }
            }
          });
        }

        // Include attributes in the main object
        if (Object.keys(attributes).length > 0) {
          json['_'] = json['_'] || '';
          Object.assign(json, attributes);
        }
      }

      return json;
    }

    // Start parsing from the root element
    return parseXmlFromFile(srcDOM.documentElement);
  }

  async saveFile(file: Express.Multer.File): Promise<void> {
    const filePath = path.join(this.xmlFolder, file.originalname);
    fs.writeFileSync(filePath, file.buffer);
  }

  async checkFileNameExists(fileName: string): Promise<boolean> {
    const files = fs.readdirSync(this.xmlFolder);
    return files.includes(fileName);
  }

  async formatDate(dateStr: string): Promise<string> {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  async getBookingByConfirmationNo(confirmationNo: string): Promise<any> {
    const files = fs.readdirSync(this.xmlFolder);

    // Find the file matching the confirmation number
    const file = files.find((file) => {
      const fileName = path.parse(file).name;
      const number = fileName.replace(/^booking_/, '');
      return number === confirmationNo;
    });

    if (!file) {
      throw new NotFoundException(
        `Booking with confirmation number ${confirmationNo} not found`,
      );
    }

    const filePath = path.join(this.xmlFolder, file);
    const jsonData = await this.parseXmlFileWithLib(filePath);

    const booking = jsonData['soap:Body'].FetchBookingResponse.HotelReservation;
    const UniqueIDList = booking['r:UniqueIDList']['c:UniqueID'];
    const RoomStays = booking['r:RoomStays']['hc:RoomStay'];
    const ResGuests =
      booking['r:ResGuests']['r:ResGuest']['r:Profiles']['Profile'];
    const ReservationHistory = booking['r:ReservationHistory'];

    const arrival = await this.formatDate(
      RoomStays['hc:TimeSpan']['hc:StartDate'],
    );

    const departure = await this.formatDate(
      RoomStays['hc:TimeSpan']['hc:EndDate'],
    );
    const createdDt = await this.formatDate(ReservationHistory.insertDate);

    const guestCounts = RoomStays['hc:GuestCounts']['hc:GuestCount'];
    const adults =
      guestCounts.find((item: any) => item.ageQualifyingCode === 'ADULT')
        ?.count || 0;
    const children =
      guestCounts.find((item: any) => item.ageQualifyingCode === 'CHILD')
        ?.count || 0;

    const roomRate = RoomStays['hc:RoomRates']['hc:RoomRate'];
    const rateAmount = {
      amount: roomRate['hc:Rates']['hc:Rate']['hc:Base']._,
      currency: roomRate['hc:Rates']['hc:Rate']['hc:Base'].currencyCode,
    };

    return {
      confirmation_no: UniqueIDList[0]._,
      resv_name_id: UniqueIDList[1]._,
      arrival: arrival,
      departure: departure,
      adults: adults,
      children: children,
      roomtype: roomRate.roomTypeCode,
      ratecode: roomRate.ratePlanCode,
      rateamount: rateAmount,
      guarantee: RoomStays['hc:Guarantee'].guaranteeType,
      method_payment:
        RoomStays['hc:Payment']['hc:PaymentsAccepted']['hc:PaymentType'][
          'hc:OtherPayment'
        ].type,
      computed_resv_status: RoomStays['hc:HotelReference']._,
      last_name: ResGuests?.Customer?.PersonName?.['c:lastName'] ?? '',
      first_name: ResGuests?.Customer?.PersonName?.['c:firstName'] ?? '',
      title: ResGuests?.Customer?.PersonName?.['c:nameTitle'] ?? '',
      phone_number: ResGuests?.Phones?.NamePhone?.['c:PhoneNumber'] ?? '',
      email: ResGuests?.Customer?.PersonName?.['c:email'] ?? '',
      booking_balance: RoomStays['hc:CurrentBalance']._,
      booking_created_date: createdDt,
      address: ResGuests?.Addresses?.NameAddress?.['c:countryCode'],
    };
  }

  async getBookingByConfirmationNoWithoutLib(
    confirmationNo: string,
  ): Promise<any> {
    const files = fs.readdirSync(this.xmlFolder);

    // Find the file matching the confirmation number
    const file = files.find((file) => {
      const fileName = path.parse(file).name;
      const number = fileName.replace(/^booking_/, '');
      return number === confirmationNo;
    });

    if (!file) {
      throw new NotFoundException(
        `Booking with confirmation number ${confirmationNo} not found`,
      );
    }

    const filePath = path.join(this.xmlFolder, file);
    const jsonData = await this.parseXmlFileWithoutLib(filePath);

    const booking = jsonData['soap:Body'].FetchBookingResponse.HotelReservation;
    const UniqueIDList = booking['r:UniqueIDList']['c:UniqueID'];
    const RoomStays = booking['r:RoomStays']['hc:RoomStay'];
    const ResGuests =
      booking['r:ResGuests']['r:ResGuest']['r:Profiles']['Profile'];
    const ReservationHistory = booking['r:ReservationHistory'];

    const arrival = await this.formatDate(
      RoomStays['hc:TimeSpan']['hc:StartDate'],
    );

    const departure = await this.formatDate(
      RoomStays['hc:TimeSpan']['hc:EndDate'],
    );
    const createdDt = await this.formatDate(ReservationHistory.insertDate);

    const guestCounts = RoomStays['hc:GuestCounts']['hc:GuestCount'];
    const adults =
      guestCounts.find((item: any) => item.ageQualifyingCode === 'ADULT')
        ?.count || 0;
    const children =
      guestCounts.find((item: any) => item.ageQualifyingCode === 'CHILD')
        ?.count || 0;

    const roomRate = RoomStays['hc:RoomRates']['hc:RoomRate'];
    const rateAmount = {
      amount: roomRate['hc:Rates']['hc:Rate']['hc:Base']._,
      currency: roomRate['hc:Rates']['hc:Rate']['hc:Base'].currencyCode,
    };

    return {
      confirmation_no: UniqueIDList[0]._,
      resv_name_id: UniqueIDList[1]._,
      arrival: arrival,
      departure: departure,
      adults: adults,
      children: children,
      roomtype: roomRate.roomTypeCode,
      ratecode: roomRate.ratePlanCode,
      rateamount: rateAmount,
      guarantee: RoomStays['hc:Guarantee'].guaranteeType,
      method_payment:
        RoomStays['hc:Payment']['hc:PaymentsAccepted']['hc:PaymentType'][
          'hc:OtherPayment'
        ].type,
      computed_resv_status: RoomStays['hc:HotelReference']._,
      last_name: ResGuests?.Customer?.PersonName?.['c:lastName'] ?? '',
      first_name: ResGuests?.Customer?.PersonName?.['c:firstName'] ?? '',
      title: ResGuests?.Customer?.PersonName?.['c:nameTitle'] ?? '',
      phone_number: ResGuests?.Phones?.NamePhone?.['c:PhoneNumber'] ?? '',
      email: ResGuests?.Customer?.PersonName?.['c:email'] ?? '',
      booking_balance: RoomStays['hc:CurrentBalance']._,
      booking_created_date: createdDt,
      address: ResGuests?.Addresses?.NameAddress?.['c:countryCode'],
    };
  }
}
