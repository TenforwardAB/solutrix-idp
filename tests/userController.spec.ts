import { updateUser } from "../src/controllers/userController";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import models from "../src/config/db";

jest.mock("bcryptjs");
jest.mock("../src/config/db", () => ({
  user: {
    update: jest.fn(),
    findOne: jest.fn(),
  },
}));
/**
 * Function used to create the output from the ORM model to simplify tests.
 * @param users 
 * @returns 
 */
function createUserOutputFromDatabase(users: any[]): [number, any[]] {
  return [
    1,
    users,
  ];

}
describe("updateUser", () => {
  const mockRequest = (body: any, params: any): Partial<Request> =>
    ({
      body,
      params,
    }) as Request;

  const mockResponse = (): Partial<Response> => {
    const res: any = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    res.send = jest.fn().mockReturnThis();
    return res;
  };

  const req = mockRequest(
    { username: "updatedUser", password: "newPassword" },
    { id: "1" }
  );

  const res = mockResponse();

  it("should update a user and return the updated user with status 200", async () => {
    const user = {
      userid: "1",
      username: "updatedUser",
      passwordhash: "some password hash",
    }
    const updatedUser = createUserOutputFromDatabase([user]);
    (models.user.update as jest.Mock).mockResolvedValue(updatedUser);

    await updateUser(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith(user);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should return 404 if user is not found", async () => {

    const noUser = createUserOutputFromDatabase([]);

    (models.user.update as jest.Mock).mockResolvedValue(noUser);

    await updateUser(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return 400 if an error occurs", async () => {

    (models.user.update as jest.Mock).mockRejectedValue(
      new Error("Update error")
    );

    await updateUser(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
