import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header not found');
    }

    const [, token] = authHeader.split(' ');

    if (!token) {
      throw new UnauthorizedException(
        'Token not found in authorization header',
      );
    }

    try {
      const payload = this.jwtService.verify(token);
      request.user = payload; // Add payload to request object
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
