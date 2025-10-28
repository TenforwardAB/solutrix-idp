/**
 * Copyright (C) 2024 [TSEI]
 *
 * Created on 2024-09-23 :: 13:58 BY andrek
 */
import { Request, Response } from "express";
import models, { sequelize } from "../config/db";
import {wds} from "../config/db";
import bcrypt from "bcryptjs";
import {v4 as uuidv4} from "uuid";

export const getAllCustomers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const customers = await models.customer.findAll();
    return res.status(200).json(customers);
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ message: err.message });
  }
};

export const getCustomerById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const customerData = await models.customer.findByPk(req.params.id);
    if (!customerData)
      return res.status(404).json({ message: "Customer not found" });
    return res.status(200).json(customerData);
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ message: err.message });
  }
};

export const createCustomer = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const newCustomer = await models.customer.create(req.body);
    return res.status(201).json(newCustomer);
  } catch (error) {
    const err = error as Error;
    return res.status(400).json({ message: err.message });
  }
};

export const updateCustomer = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const updatedCustomer = await models.customer.update(req.body, {
      where: { customerid: req.params.id },
      returning: true,
    });
    if (!updatedCustomer[1].length)
      return res.status(404).json({ message: "Customer not found" });
    return res.status(200).json(updatedCustomer[1][0]);
  } catch (error) {
    const err = error as Error;
    return res.status(400).json({ message: err.message });
  }
};

export const deleteCustomer = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const deleted = await models.customer.destroy({
      where: { customerid: req.params.id },
    });
    if (!deleted)
      return res.status(404).json({ message: "Customer not found" });
    return res.status(204).json();
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ message: err.message });
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const users = await models.user.findAll();
    return res.status(200).json(users);
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ message: err.message });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userData = await models.user.findByPk(req.params.id);
    if (!userData) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(userData);
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ message: err.message });
  }
};

export const createUser = async (
    req: Request,
    res: Response
): Promise<Response> => {
  const { accountType, birth, gender, username, password, rescue_email, ...rest } = req.body;
  console.log(req.body);

  // 1️⃣ enforce only username & password
  if (!username || !password) {
    return res
        .status(400)
        .json({ success: false, message: 'username and password are required' });
  }

  // begin transaction
  const t = await sequelize.transaction();
  try {
    // 2️⃣ optionally handle rescue_email mapping
    if (rescue_email) {
      // check uniqueness
      const existing = await models.rescue_email_mappings.findOne({
        where: { rescue_mail: rescue_email },
        transaction: t,
      });
      if (existing) {
        await t.rollback();
        return res
            .status(409)
            .json({ success: false, message: 'This rescue_email is already in use' });
      }

      // you must supply an address to map against
      if (!username) {
        await t.rollback();
        return res
            .status(400)
            .json({ success: false, message: 'address is required when using rescue_email' });
      }

      await models.rescue_email_mappings.create(
          { id: uuidv4(), rescue_mail: rescue_email, email: username },
          { transaction: t }
      );
    }
    const ALLOWED_USER_FIELDS = new Set([
      'username',
      'password',
      'hashedPassword',
      'allowUnsafe',
      'address',
      'emptyAddress',
      'language',
      'retention',
      'name',
      'targets',
      'spamLevel',
      'quota',
      'recipients',
      'forwards',
      'filters',
      'requirePasswordChange',
      'imapMaxUpload',
      'imapMaxDownload',
      'pop3MaxDownload',
      'pop3MaxMessages',
      'imapMaxConnections',
      'receivedMax',
      'fromWhitelist',
      'tags',
      'addTagsToAddress',
      'uploadSentMessages',
      'mailboxes',
      'disabledScopes',
      'metaData',
      'internalData',
      'pubKey',
      'encryptMessages',
      'encryptForwarded',
      'featureFlags',
      'sess',
      'ip',
    ]);

// 2) Filter `rest` down to only those keys:
    const filteredRest: Record<string, any> = {};
    for (const key of Object.keys(rest)) {
      if (ALLOWED_USER_FIELDS.has(key)) {
        filteredRest[key] = (rest as any)[key];
      }
    }

    // 3️⃣ call your generic createUser – spread in all other allowed fields
    // build your base payload
    const payload: Record<string, any> = {
      username,
      password,
      ...filteredRest,
      disabledScopes: ['imap','pop3','smtp'],
      quota:       500 * 1024 * 1024,   // 500 MB
      recipients:  100,                 // max 100 sends / 24 h
      forwards:    50,                  // max 50 forwards / 24 h
      filters:     5,                   // up to 5 filters
      receivedMax: 10,                  // max 10 inbound / 60 s
    };

// if this is a private account, tack on the extra internalData
    if (accountType === 'private') {
      payload.internalData = {
        ...(filteredRest.internalData || {}),
        role: 'Crewman',
        cid:  '00000000-0000-0000-0000-000000000000',
      };
      payload.tags =['private'];
    }

    if (birth && gender) {
      payload.metaData = {
        ...(filteredRest.metaData || {}),   // keep any ohter user set metaData
        birth: {
          month: String(birth.month),
          day:   String(birth.day),
          year:  String(birth.year),
        },
        gender: String(gender),
      };
    }

// now call the API
    // @ts-ignore
    const userResult = await wds.users.createUser(payload);


    // 4️⃣ commit everything
    await t.commit();
    return res.status(201).json({ success: true, id: userResult.id });
  } catch (err: any) {
    await t.rollback();
    console.error('createUserController error:', err);
    return res
        .status(500)
        .json({ success: false, message: err.message || 'User creation failed' });
  }
}
/**
 * Update user details
 *
 * This function updates the user details based on the provided fields in the request body.
 * If a password is provided, it hashes the password before updating the user record in the database.
 *
 * @param req - The request object containing the user details to be updated.
 * @param res - The response object used to send back the appropriate response.
 * @returns A JSON response indicating the success or failure of the update operation.
 */
export const updateUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { password, ...otherFields } = req.body;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      otherFields.passwordhash = hashedPassword;
    }

    const updatedUser = await models.user.update(otherFields, {
      where: { userid: req.params.id },
      returning: true,
    });
    const returnedUserList = updatedUser[1];
    if (returnedUserList.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const firstUser = returnedUserList[0];
    return res.status(200).json(firstUser);
  } catch (error) {
    const err = error as Error;
    return res.status(400).json({ message: err.message });
  }
};
/**
 * Change user password
 *
 * This function allows a user to change their password by providing their old password and a new password.
 * It verifies the old password, hashes the new password, and updates the user's password in the database.
 *
 * @param req - The request object containing the old and new passwords.
 * @param res - The response object used to send back the appropriate response.
 * @returns A JSON response indicating the success or failure of the password change operation.
 */
export const updateUserPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await models.user.findOne({
      where: { userid: req.params.id },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.passwordhash);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await models.user.update(
      { passwordhash: hashedPassword },
      { where: { userid: req.params.id } }
    );
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    const err = error as Error;
    return res.status(400).json({ message: err.message });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const deleted = await models.user.destroy({
      where: { userid: req.params.id },
    });
    if (!deleted) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    const err = error as Error;
    return res.status(500).json({ message: err.message });
  }
};
