const greets = require('../server/protos/greet_pb');
const service = require('../server/protos/greet_grpc_pb');

const calc = require('../server/protos/calculator_pb');
const caclService = require('../server/protos/calculator_grpc_pb');

const grpc = require('grpc');

function callGreetings() {
  console.log('Hello from client');
  const client = new service.GreetServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  // we do stuff
  const request = new greets.GreetRequest();

  // Created a protocol buffer greeting message
  const greeting = new greets.Greeting();
  greeting.setFirstName('Jerry');
  greeting.setLastName('Tom');

  // set the Greeting
  request.setGreeting(greeting);

  client.greet(request, (error, response) => {
    if (!error) {
      console.log('Greeting Response: ', response.getResult());
    } else {
      console.error(error);
    }
  });
}

function callSum() {
  console.log('Hello from client');
  const client = new caclService.CalculatorServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  const sumRequest = new calc.SumRequest();
  sumRequest.setFirstNumber(10);
  sumRequest.setSecondNumber(15);

  client.sum(sumRequest, (error, response) => {
    if (!error) {
      console.log(
        sumRequest.getFirstNumber() +
          ' + ' +
          sumRequest.getSecondNumber() +
          ' = ' +
          response.getSumResult()
      );
    } else {
      console.error(error);
    }
  });
}

function callGreetManyTimes() {
  const client = new service.GreetServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  // Create request
  const request = new greets.GreetManyTimesRequest();

  const greeting = new greets.Greeting();
  greeting.setFirstName('Paulo');
  greeting.setLastName('Dichone');

  request.setGreeting(greeting);

  const call = client.greetManyTimes(request, () => {});

  call.on('data', (response) => {
    console.log('Clinet Streaming Response: ', response.getResult());
  });

  call.on('status', (status) => {
    console.log(status.details);
  });

  call.on('error', (error) => {
    console.error(error);
  });

  call.on('end', () => {
    console.log('Streaming Ended!');
  });
}

function callPrimeNumberDecomposition() {
  const client = new caclService.CalculatorServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  const request = new calc.PrimeNumberDecompositionRequest();

  let number = 11;

  request.setNumber(number);

  const call = client.primeNumberDecomposition(request, () => {});

  call.on('data', (response) => {
    console.log('Prime Factor Found: ', response.getPrimeFactor());
  });

  call.on('error', (error) => {
    console.error(error);
  });

  call.on('status', (status) => {
    console.log(status.details);
  });

  call.on('end', () => {
    console.log('Streaming Ended!');
  });
}

function callComputeAverage() {
  const client = new caclService.CalculatorServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  let request = new calc.ComputeAverageRequest();

  const call = client.computeAverage(request, (error, response) => {
    if (!error) {
      console.log(
        'Received a response from the server - Average: ',
        response.getAverage()
      );
    } else {
      console.error(error);
    }
  });

  request = new calc.ComputeAverageRequest();
  // request.setNumber(1);

  for (let i = 0; i < 1000000; i++) {
    request = new calc.ComputeAverageRequest();
    request.setNumber(i);
    call.write(request);
  }

  call.end();

  // let requestTwo = new calc.ComputeAverageRequest();
  // requestTwo.setNumber(2);

  // let requestThree = new calc.ComputeAverageRequest();
  // requestThree.setNumber(3);

  // let requestFour = new calc.ComputeAverageRequest();
  // requestFour.setNumber(4);

  // Average should be 2.5
  // call.write(request);
  // call.write(requestTwo);
  // call.write(requestThree);
  // call.write(requestFour);

  // call.end(); // we are done
}

function callLongGreeting() {
  const client = new service.GreetServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  let request = new greets.LongGreetRequest();

  const call = client.longGreet(request, (error, response) => {
    if (!error) {
      console.log('Server Response: ', response.getResult());
    } else {
      console.error(error);
    }
  });

  let count = 0,
    intervalID = setInterval(() => {
      console.log('Sending message ' + count);

      request = new greets.LongGreetRequest();
      const greeting = new greets.Greeting();
      greeting.setFirstName('Fahmi');
      greeting.setLastName('Alfareza');

      request.setGreet(greeting);

      requestTwo = new greets.LongGreetRequest();
      const greetingTwo = new greets.Greeting();
      greetingTwo.setFirstName('Alfareza');
      greetingTwo.setLastName('Fahmi');

      requestTwo.setGreet(greetingTwo);

      call.write(request);
      call.write(requestTwo);

      if (++count > 3) {
        clearInterval(intervalID);
        call.end(); // we've sent all messages! we are done!
      }
    }, 1000);
}

async function sleep(interval) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), interval);
  });
}

async function callBiDiFindMaximum() {
  // Created our server client
  console.log("Hello, I'm a gRPC Client!");

  const client = new caclService.CalculatorServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  let request = new calc.FindMaximumRequest();

  const call = client.findMaximum(request, (error, response) => {});

  call.on('data', (response) => {
    console.log('Got new Max from Server => ', response.getMaximum());
  });

  call.on('error', (error) => {
    console.error(error);
  });

  call.on('end', () => {
    console.log('Server is completed sending messages');
  });

  // data
  let data = [3, 5, 17, 9, 8, 30, 12, 345, 129, 0];
  for (let index = 0; index < data.length; index++) {
    request = new calc.FindMaximumRequest();
    console.log('Sending number: ' + data[index]);

    request.setNumber(data[index]);
    call.write(request);
    await sleep(1000);
  }
  call.end(); // we are done sending messages
}

async function callBiDirect() {
  // Created our server client
  console.log("Hello, I'm a gRPC Client!");

  const client = new service.GreetServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  let request = new greets.GreetEveryoneRequest();

  const call = client.greetEveryone(request, (error, response) => {
    console.log('Server Response: ' + response);
  });

  call.on('data', (response) => {
    console.log('Hello Client!' + response.getResult());
  });

  call.on('error', (error) => {
    console.error(error);
  });

  call.on('end', () => {
    console.log('Client The End');
  });

  for (let index = 0; index < 10; index++) {
    const greeting = new greets.Greeting();
    greeting.setFirstName('Fahmi');
    greeting.setLastName('Alfareza');

    request = new greets.GreetEveryoneRequest();
    request.setGreet(greeting);

    call.write(request);
    await sleep(1500);
  }

  call.end();
}

function main() {
  callBiDiFindMaximum();
  // callBiDirect();
  // callComputeAverage();
  // callLongGreeting();
  // callPrimeNumberDecomposition();
  // callGreetManyTimes();
  // callGreetings();
  // callSum();
}

main();
