import { createUser } from "../src/controllers/userController";
import bcrypt from "bcryptjs";
import models from "../src/config/db";

import { Request, Response } from "express";

jest.mock("bcryptjs");
jest.mock("../src/config/db", () => ({
  user: {
    create: jest.fn(),
  },
  role: {
    findOne: jest.fn(),
  },
  user_role_customer: {
    create: jest.fn(),
  },
}));

/**
 * Test suite for the `register` function.
 *
 * This suite tests the `register` function for:
 *
 * 1. **Successful User Registration**: Ensures the function correctly hashes the password,
 *    creates the user in the database, and returns a 201 status with user data.
 *
 * 2. **Error Handling**: Validates that the function responds with a 500 status and an error
 *    message when a database error occurs.
 *
 */

describe("register", () => {
  const mockRequest = (body: any): Partial<Request> =>
    ({
      body,
    }) as Request;

  const mockResponse = (): Partial<Response> => {
    const res: any = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    return res;
  };

  it("should create a new user and assign a role", async () => {
    const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {}); // Suppress console.log
    const req = mockRequest({
      username: "testuser",
      password: "password123",
      email: "test@example.com",
      customerid: "12345",
      rolename: "admin",
    });

    const res = mockResponse();

    const mockRole = { roleid: "1", rolename: "admin" };
    const mockNewUser = {
      userid: "1",
      username: "testuser",
      email: "test@example.com",
      customerid: "12345",
    };
    (models.role.findOne as jest.Mock).mockResolvedValue(mockRole);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
    (models.user.create as jest.Mock).mockResolvedValue(mockNewUser);
    (models.user_role_customer.create as jest.Mock).mockResolvedValue({});

    await createUser(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ user: mockNewUser });
    expect(models.role.findOne).toHaveBeenCalledWith({
      where: { rolename: "admin" },
    });
    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
    expect(models.user.create).toHaveBeenCalledWith({
      username: "testuser",
      passwordhash: "hashedPassword",
      email: "test@example.com",
      customerid: "12345",
    });
    expect(models.user_role_customer.create).toHaveBeenCalledWith({
      userid: "1",
      roleid: "1",
      customerid: "12345",
    });
    consoleLogMock.mockRestore();
  });

  it("should handle errors gracefully", async () => {
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
    const req = mockRequest({
      username: "testuser",
      password: "password123",
      email: "test@example.com",
      customerid: "12345",
    });

    const res = mockResponse();

    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
    (models.user.create as jest.Mock).mockRejectedValue(
      new Error("Database error")
    );

    await createUser(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    consoleErrorMock.mockRestore();
  });
});
