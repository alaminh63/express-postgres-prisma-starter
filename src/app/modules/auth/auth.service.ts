import prisma from "../../shared/prisma";
import { UserCreateInput } from "../../../generated/prisma";
const login = async (data: UserCreateInput) => {
    const user = await prisma.user.findUnique({
        where: {
            email: data.email as string,
        }
    });
    return user;
};

export default { login };