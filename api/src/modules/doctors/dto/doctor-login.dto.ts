import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class DoctorLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
