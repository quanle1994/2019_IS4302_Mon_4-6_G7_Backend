import express from 'express';
import {verifyToken} from "../middleware/authenticate";
import {getAllUsers, getAllUsersRequest} from "../controllers/adminController";

const adminRouter = express.Router();

adminRouter.route('/getAllUsers')
  .get(verifyToken, getAllUsers);

adminRouter.route('/getAllRUsers')
  .get(verifyToken, getAllUsersRequest);

export {
  adminRouter,
}