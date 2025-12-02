import { Request, Response } from "express";

import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import authService from "./auth.service";

const login = catchAsync(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    sendResponse(res, {
        status: 200,
        success: true,
        message: "User logged in successfully",
        data: result
    });
});

export const authControllers = { login };