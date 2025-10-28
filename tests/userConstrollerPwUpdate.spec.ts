import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import models from "../src/config/db";
import { updateUserPassword } from "../src/controllers/userController"; // Adjust the import based on your project structure

jest.mock("bcryptjs");
jest.mock("../src/config/db", () => ({
  user: {
    update: jest.fn(),
    findOne: jest.fn(),
  },
}));

describe("updateUserPassword", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  const mockUser = {
    userid: "123",
    passwordhash: "OldPasswordHash",
  };

  beforeEach(() => {
    req = {
      params: { id: "123" },
      body: { oldPassword: "oldPassword", newPassword: "newPassword" },
    };
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));
    res = {
      status: statusMock,
    };
    jest.clearAllMocks();
  });

  it("should return 404 if user is not found", async () => {
    (models.user.findOne as jest.Mock).mockResolvedValue(null);

    await updateUserPassword(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ message: "User not found" });
  });

  it("should return 400 if old password is incorrect", async () => {
    (models.user.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await updateUserPassword(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Invalid password",
    });
  });

  it("should return 200 if password is updated successfully", async () => {
    (models.user.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedNewPassword");
    (models.user.update as jest.Mock).mockResolvedValue([1]);

    await updateUserPassword(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      message: "Password updated successfully",
    });
  });
});
