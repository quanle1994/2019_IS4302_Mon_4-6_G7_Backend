import express from 'express';
import {verifyToken} from "../middleware/authenticate";
import {getAllUsers} from "../controllers/adminController";

const adminRouter = express.Router();

adminRouter.route('/getAllUsers')
  .get(verifyToken, getAllUsers);

export {
  adminRouter,
}