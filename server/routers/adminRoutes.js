import express from 'express';
import {verifyToken} from "../middleware/authenticate";
import {getAllUsers, getAllUsersRequest, setStatusRequest} from "../controllers/adminController";

const adminRouter = express.Router();

adminRouter.route('/getAllUsers')
  .get(verifyToken, getAllUsers);

adminRouter.route('/getAllRUsers')
  .get(verifyToken, getAllUsersRequest);

adminRouter.route('/setStatus')
  .post(verifyToken, setStatusRequest);

export {
  adminRouter,
}