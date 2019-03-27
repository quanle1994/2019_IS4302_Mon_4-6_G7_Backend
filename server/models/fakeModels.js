const poheng = {
  username: 'poheng@gmail.com',
  type: 'CA',
  assets:{
    golds: {
      balance: [1, 2, 3],
      transactions: [],
    },
    deeds: {
      balance: [1, 2, 3, 4],
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
  golds: {
    balance: [4, 5]
  },
};

const deeds = {
  1: {id: 1, maxWeight: 500, unitPrice: 2000, status: 'FOR_SALE', goldId: 1, owner: 'poheng@gmail.com'},
  2: {id: 2, maxWeight: 500, unitPrice: 1900, status: 'FOR_SALE', goldId: 2, owner: 'poheng@gmail.com'},
  3: {id: 3, maxWeight: 500, unitPrice: 1500, status: 'FOR_SALE', goldId: 3, owner: 'poheng@gmail.com'},
  4: {id: 4, maxWeight: 500, unitPrice: 0, status: 'INTERNAL', goldId: 3, owner: 'poheng@gmail.com'},
};

const golds = {
  1: {id: 1, weight: 12345, purity: 99.9, cost: 1234500, owner: 'poheng@gmail.com'},
  2: {id: 2, weight: 123, purity: 98.9, cost: 12345, owner: 'poheng@gmail.com'},
  3: {id: 3, weight: 1233, purity: 95.9, cost: 123345, owner: 'poheng@gmail.com'},
  4: {id: 4, weight: 54321, purity: 99.9, cost: 5432100, owner: 'miner@gmail.com'},
  5: {id: 5, weight: 321, purity: 98.9, cost: 32100, owner: 'miner@gmail.com'}
};

export {
  poheng,
  miner,
  deeds,
  golds,
}