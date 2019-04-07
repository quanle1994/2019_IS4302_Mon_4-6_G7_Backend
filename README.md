# IS4302-GoldChain
Blockchain application on Gold Trading

## Deployment Secquence
1. Deploy Hyperledger
- Download and import the goldchain.bna file on to Hyperledger Playground
- Start the rest server at port 3001
1. Deploy Nodejs Server
- Ensure you have downloaded Nodejs. If not, download it here https://nodejs.org/en/download/
- Download this repo onto your computer and unzip it.
- Navigate to the extracted folder in command prompt (for Windows). For Mac and Linux, use the terminal
- Run npm install
- Run npm start
- The server will be running port 6000
1. Init Data
- Navigate to the same folder where the Nodejs repo is extracted
- Run npn run init
1. Deploy ReactJS Server
- Retrieve the repo at this link https://github.com/quanle1994/IS4302-GoldChain-Frontend. Download it onto your computer and unzip it.
- Open the unzipped folder using WebStorm or Visual Studio code
- In the IDE's terminal, run npm install
- Run npm start