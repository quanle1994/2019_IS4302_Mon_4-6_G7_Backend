import {getAllCas, getAllMiners, getAllRUsers, getUserById} from "../composer/api";
import {hash} from "../middleware/commons";

const getAllUsers = async (req, res) => {
  const { user } = req;
  const { type } = user;
  if (user === undefined || type !== 'ADMIN') {
    return res.status(401).send({message: 'Unauthorised User'});
  }
  let r = await getAllRUsers();
  r = r.data.map(m => {
    delete m.password;
    return m;
  });
  let ra = await getAllCas();
  ra = ra.data.map(m => {
    delete m.password;
    return m;
  });
  r.push(...ra);
  let rb = await getAllMiners();
  rb = rb.data.map(m => {
    delete m.password;
    return m;
  });
  r.push(...rb);
  return res.status(200).send(r);
};

const getAllUsersRequest = async (req, res) => {
  try {
    const r = await getAllRUsers();
    return res.status(200).send(r.data.map(m => {
      delete m.password;
      return m;
    }));
  } catch (e) {
    console.log(e);
    return res.status(500).send({message: 'Failed to get miners'});
  }
};

const setStatusRequest = async (req, res) => {
  try {
    const { user, body } = req;
    if (user.type !== 'ADMIN') return res.status(401).send({message: 'You are not an Admin'});
    const { userId, status } = body;
    const rUser = await getUserById(userId);
    const data = {
      "$class": "org.acme.goldchain.RegisteredUser",
      "userId": rUser.userId,
      "email": rUser.email,
      "name": rUser.name,
      "password": rUser.password,
      "status": status,
    };
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Failed to get miners'});
  }
};

export {
  getAllUsers,
  getAllUsersRequest,
  setStatusRequest,
}