const getAllUsers = async (req, res) => {
  const {user, body} = req;
  const { username, type } = user;
  if (user === undefined || type !== 'ADMIN') {
    return res.status(401).send({message: 'Unauthorised User'});
  }
  return res.status(200).send([]);
};

export {
  getAllUsers,
}