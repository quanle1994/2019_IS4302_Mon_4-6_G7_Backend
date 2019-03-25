const poheng = {
  username: 'poheng@gmail.com',
  type: 'CA',
  assets:{
    golds: {
      balance: [
        {id: 1, weight: 12345, purity: 99.9, cost: 1234500},
        {id: 2, weight: 123, purity: 98.9, cost: 12345},
        {id: 3, weight: 1233, purity: 95.9, cost: 123345}
      ],
      transactions: [],
    },
    deeds: {
      balance: [
        {maxWeight: 500, purity: 99.9, unitPrice: 2000, status: 'FOR_SALE', goldId: 1},
        {maxWeight: 500, purity: 98.9, unitPrice: 1000, status: 'INTERNAL', goldId: 2},
      ],
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