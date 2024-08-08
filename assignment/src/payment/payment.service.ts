import { Injectable, NotFoundException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { BookingService } from 'src/booking/booking.service';
import * as CryptoJS from 'crypto-js';
import axios from 'axios';

@Injectable()
export class PaymentService {
  private readonly xmlFolder = path.join(__dirname, '..', '..', 'xml');

  constructor(private readonly bookingService: BookingService) {
    if (!fs.existsSync(this.xmlFolder)) {
      fs.mkdirSync(this.xmlFolder);
    }
  }

  async processPayment(confirmationNo: string): Promise<string> {
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
    const jsonData = await this.bookingService.parseXmlFileWithLib(filePath);
    const booking = jsonData['soap:Body'].FetchBookingResponse.HotelReservation;

    const RoomStays = booking['r:RoomStays']['hc:RoomStay'];
    const ResGuests =
      booking['r:ResGuests']['r:ResGuest']['r:Profiles']['Profile'];
    const roomRate = RoomStays['hc:RoomRates']['hc:RoomRate'];
    const rateAmount = {
      amount: roomRate['hc:Rates']['hc:Rate']['hc:Base']._,
      currency: roomRate['hc:Rates']['hc:Rate']['hc:Base'].currencyCode,
    };

    const merchantPasscode = '123456789';
    const paymentDetails: { [key: string]: string } = {
      function: 'CreateOrder',
      merchant_site_code: '7',
      order_code: confirmationNo,
      order_description: '',
      amount: rateAmount.amount,
      currency: rateAmount.currency,
      buyer_fullname:
        ResGuests.Customer.PersonName['c:firstName'] +
        ' ' +
        ResGuests.Customer.PersonName['c:lastName'],
      buyer_email:
        ResGuests?.Customer?.PersonName['c:email'] ?? 'test@example.com',
      buyer_mobile:
        ResGuests?.Phones?.NamePhone['c:PhoneNumber'] ?? '1234567890',
      buyer_address: ResGuests.Addresses.NameAddress['c:countryCode'],
      return_url: 'http://localhost:3000/payment-success',
      cancel_url: 'http://localhost:3000/payment-fail',
      notify_url: '',
      language: 'vi',
    };
    const concatenatedString = `${paymentDetails.merchant_site_code}|${confirmationNo}|${paymentDetails.order_description}|${paymentDetails.amount}|${paymentDetails.currency}|${paymentDetails.buyer_fullname}|${paymentDetails.buyer_email}|${paymentDetails.buyer_mobile}|${paymentDetails.buyer_address}|${paymentDetails.return_url}|${paymentDetails.cancel_url}|${paymentDetails.notify_url}|${paymentDetails.language}|${merchantPasscode}`;
    paymentDetails.checksum = CryptoJS.MD5(concatenatedString).toString();

    const formData = new FormData();
    for (const key in paymentDetails) {
      if (paymentDetails.hasOwnProperty(key)) {
        formData.append(key, paymentDetails[key]);
      }
    }

    try {
      const response = await axios.post(
        'https://sandbox2.nganluong.vn/vietcombank-checkout/vcb/api/web/checkout/version_1_0',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      // Return the response or handle it accordingly
      return response.data.result_data.checkout_url;
    } catch (error) {
      // Handle error appropriately
      console.error('Error processing payment:', error);
      throw new Error('Payment processing failed');
    }
  }
}
