import {
  IsMongoId,
  IsString,
  IsNotEmpty,
} from 'class-validator';

export class CreatePaymentOrderDto {
  @IsMongoId()
  bookingId: string;
}

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  razorpay_order_id: string;

  @IsString()
  @IsNotEmpty()
  razorpay_payment_id: string;

  @IsString()
  @IsNotEmpty()
  razorpay_signature: string;
}
