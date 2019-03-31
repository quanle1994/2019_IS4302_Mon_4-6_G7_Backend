import {api} from "../composer/api";

const value = [];
process.argv.forEach(function (val, index, array) {
  if (index < 2) return;
  value.push(val);
});

const userSchema = {
  username: value[1],
  password: value[2],
};

if (value[0] === 'Miner') {
  api.createMiner(userSchema).then(() => console.log('CREATED MINER'));
} else if (value[0] === 'CA') {
  api.createCA(userSchema).then(() => console.log('CREATED CA'));
} else {
  console.log('INVALID COMMAND');
}
