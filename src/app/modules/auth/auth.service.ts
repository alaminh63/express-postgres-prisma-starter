
import prisma from "../../shared/prisma";
import bcrypt from "bcryptjs";
import AppError from "../../errors/AppError";
import config from "../../config";
import { createToken } from "../../utils/commonUtils";

interface ILoginPayload {
    email: string;
    password: string;
    phone: string;
}

const login = async (payload: ILoginPayload) => {
 const { email, password, phone } = payload;   
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { email: email },
                { phone: phone },
            ],
            status: "ACTIVE"
        }
    });
    const isCorrectPassword = await bcrypt.compare(payload.password, user.password);
    if (!isCorrectPassword) {
            throw new AppError(400, "auth", "Password is incorrect!")
    }

    const accessToken = createToken({ id: user.id, email: user.email as string }, config.jwt_access_token_secret, "1h");
    const refreshToken = createToken({ id: user.id, email: user.email as string }, config.jwt_refresh_token_secret, "90d");
    return {
        refreshToken,
        accessToken,
    }
}  

export default { login };