import { Type } from "class-transformer";
import { IsArray, IsDate, IsInt, IsOptional, IsString, Min, Max, Matches, IsUrl, ArrayMinSize } from "class-validator";

export class CreateAttendanceDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(150)
    age: number;

    @IsString()
    @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, {
        message: 'phoneNumber must be a valid phone number'
    })
    phoneNumber: string;

    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    @IsUrl({}, { each: true, message: 'Each image must be a valid URL' })
    image: string[];

    @IsString()
    city: string;

    @IsOptional()
    @IsString()
    province?: string;

    @IsString()
    companyName: string;

    @IsString()
    position: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    date?: Date;

    @IsOptional()
    @IsString()
    remark?: string;
}