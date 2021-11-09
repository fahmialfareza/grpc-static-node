const greets = require('../server/protos/greet_pb');
const service = require('../server/protos/greet_grpc_pb');

const calc = require('../server/protos/calculator_pb');
const caclService = require('../server/protos/calculator_grpc_pb');

const grpc = require('grpc');

/* 
  Implements the greet RPC method.
*/
function sum(call, callback) {
  const sumResponse = new calc.SumResponse();

  sumResponse.setSumResult(
    call.request.getFirstNumber() + call.request.getSecondNumber()
  );

  callback(null, sumResponse);
}

function greetManyTimes(call, callback) {
  const firstName = call.request.getGreeting().getFirstName();

  let count = 0,
    intervalID = setInterval(() => {
      const greetManyTimesResponse = new greets.GreetManyTimesResponse();
      greetManyTimesResponse.setResult(firstName);

      // Setup streaming
      call.write(greetManyTimesResponse);
      if (++count > 9) {
        clearInterval(intervalID);
        call.end(); // we have sent all messages!
      }
    }, 1000);
}

// Prime Factor
function primeNumberDecomposition(call, callback) {
  let number = call.request.getNumber();
  let divisor = 2;

  console.log('Received number: ', number);

  while (number > 1) {
    if (number % divisor === 0) {
      const primeNumberDecompositionResponse =
        new calc.PrimeNumberDecompositionResponse();

      primeNumberDecompositionResponse.setPrimeFactor(divisor);

      number = number / divisor;

      // Write message using call.write()

      call.write(primeNumberDecompositionResponse);
    } else {
      divisor++;
      console.log('Divisor has increased to ', divisor);
    }
  }

  call.end(); // all messages sent! we are done!
}

function longGreet(call, callback) {
  call.on('data', (request) => {
    const fullName =
      request.getGreet().getFirstName() +
      ' ' +
      request.getGreet().getLastName();

    console.log('Hello ' + fullName);
  });

  call.on('error', (error) => {
    console.error(error);
  });

  call.on('end', () => {
    const response = new greets.LongGreetResponse();
    response.setResult('Long Greet Client Streaming....');

    callback(null, response);
  });
}

function computeAverage(call, callback) {
  // Running sum and count
  let sum = 0;
  let count = 0;

  call.on('data', (request) => {
    // increment sum
    sum += request.getNumber();

    console.log('Got number: ' + request.getNumber());

    // increment count
    count += 1;
  });

  call.on('error', (error) => {
    console.error(error);
  });

  call.on('end', () => {
    // compute the actual average
    let average = sum / count;

    const response = new calc.ComputeAverageResponse();
    response.setAverage(average);

    callback(null, response);
  });
}

async function sleep(interval) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), interval);
  });
}

// Find Maximum
async function findMaximum(call, callback) {
  let currentMax = 0;
  let currentNumber = 0;

  call.on('data', (request) => {
    currentNumber = request.getNumber();

    if (currentNumber > currentMax) {
      currentMax = currentNumber;

      const response = new calc.FindMaximumResponse();
      response.setMaximum(currentMax);

      call.write(response);
    } else {
      //  do noting
    }

    console.log('Streamed number: ', request.getNumber());
  });

  call.on('error', (error) => {
    console.error(error);
  });

  call.on('end', () => {
    const response = new calc.FindMaximumResponse();
    response.setMaximum(currentMax);

    call.write(response);

    call.end();

    console.log('The End!');
  });
}

async function greetEveryone(call, callback) {
  call.on('data', (response) => {
    const fullName =
      response.getGreet().getFirstName() +
      ' ' +
      response.getGreet().getLastName();

    console.log('Hello ' + fullName);
  });

  call.on('error', (error) => {
    console.error(error);
  });

  call.on('end', () => {
    console.log('The End...');
  });

  for (let index = 0; index < 10; index++) {
    // const greeting = new greets.Greeting();
    // greeting.setFirstName('Fahmi');
    // greeting.setLastName('Alfareza');

    const response = new greets.GreetEveryoneResponse();
    response.setResult('Fahmi Alfareza');

    call.write(response);
    await sleep(1000);
  }

  call.end();
}

function greet(call, callback) {
  const greeting = new greets.GreetResponse();

  greeting.setResult(
    'Hello ' +
      call.request.getGreeting().getFirstName() +
      ' ' +
      call.request.getGreeting().getLastName()
  );

  callback(null, greeting);
}

function main() {
  const server = new grpc.Server();
  server.addService(caclService.CalculatorServiceService, {
    sum,
    primeNumberDecomposition,
    computeAverage,
    findMaximum,
  });
  // server.addService(service.GreetServiceService, {
  //   greet,
  //   greetManyTimes,
  //   longGreet,
  //   greetEveryone,
  // });
  server.bind('127.0.0.1:50051', grpc.ServerCredentials.createInsecure());
  server.start();

  console.log('Server running on port 127.0.0.1:50051');
}

main();
