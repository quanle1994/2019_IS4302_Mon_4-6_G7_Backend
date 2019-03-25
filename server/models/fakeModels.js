const poheng = {
  username: 'poheng@gmail.com',
  type: 'CA',
  assets:{
    golds: {
      balance: [
        {weight: 12345, purity: 99.9, cost: 1234500},
        {weight: 123, purity: 98.9, cost: 12345}
      ],
      transactions: [],
    },
    deeds: {
      balance: [],
      transactions: [],
    },
    money: {
      balance: 1000000,
      transactions: [],
    }
  }
};

const miner = {
  username: 'miner@gmail.com',
  type: 'CA',
  golds: [
    {weight: 54321, purity: 99.9, cost: 5432100},
    {weight: 321, purity: 98.9, cost: 32100}
  ],
};

export {
  poheng,
  miner,
}