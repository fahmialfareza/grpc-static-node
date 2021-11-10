const greets = require('../server/protos/greet_pb');
const service = require('../server/protos/greet_grpc_pb');

const calc = require('../server/protos/calculator_pb');
const caclService = require('../server/protos/calculator_grpc_pb');

const blogs = require('../server/protos/blog_pb');
const blogService = require('../server/protos/blog_grpc_pb');

const fs = require('fs');

const grpc = require('grpc');

let credentials = grpc.credentials.createSsl(
  fs.readFileSync('../certs/ca.crt'),
  fs.readFileSync('../certs/client.key'),
  fs.readFileSync('../certs/client.crt')
);

let unsafeCreds = grpc.credentials.createInsecure();

function callListBlogs() {
  const client = new blogService.BlogServiceClient(
    'localhost:50051',
    credentials
  );

  const emptyBlogRequest = new blogs.ListBlogRequest();
  const call = client.listBlog(emptyBlogRequest, () => {});

  call.on('data', (response) => {
    console.log('Client Streaming Response', response.getBlog().toString());
  });

  call.on('error', (error) => {
    console.log(error);
  });

  call.on('end', () => {
    console.log('End!');
  });
}

function callCreateBlog() {
  const client = new blogService.BlogServiceClient(
    'localhost:50051',
    credentials
  );

  const blog = new blogs.Blog();
  blog.setAuthor('Johna');
  blog.setTitle('First blog post');
  blog.setContent('This is great...');

  const blogRequest = new blogs.CreateBlogRequest();
  blogRequest.setBlog(blog);

  client.createBlog(blogRequest, (error, response) => {
    if (!error) {
      console.log('Received create blog response, ', response.toString());
    } else {
      console.error(error);
    }
  });
}

function callReadBlog() {
  const client = new blogService.BlogServiceClient(
    'localhost:50051',
    credentials
  );

  const readBlogRequest = new blogs.ReadBlogRequest();
  readBlogRequest.setBlogId('1');

  client.readBlog(readBlogRequest, (error, response) => {
    if (!error) {
      console.log('Found a blog ', response.array[0]);
    } else {
      if (error.code === grpc.status.NOT_FOUND) {
        console.log('Not found');
      } else {
        // do something else
      }
    }
  });
}

function callUpdateBlog() {
  const client = new blogService.BlogServiceClient(
    'localhost:50051',
    credentials
  );

  const updateBlogRequest = new blogs.UpdateBlogRequest();

  const newBlog = new blogs.Blog();

  newBlog.setId('20');
  newBlog.setAuthor('Gary');
  newBlog.setTitle('Hello World');
  newBlog.setContent('This is great, again!');

  updateBlogRequest.setBlog(newBlog);

  console.log('Blog....', newBlog.toString());

  client.updateBlog(updateBlogRequest, (error, response) => {
    if (!error) {
    } else {
      if (error.code === grpc.status.NOT_FOUND) {
        console.log('Not Found');
      } else {
        // do more
      }
    }
  });
}

function callDeleteBlog() {
  const client = new blogService.BlogServiceClient(
    'localhost:50051',
    credentials
  );

  const deleteBlogRequest = new blogs.DeleteBlogRequest();
  const blogId = '2';

  deleteBlogRequest.setBlogId(blogId);

  client.deleteBlog(deleteBlogRequest, (error, response) => {
    if (!error) {
      console.log('Deleted blog with id: ', response.toString());
    } else {
      if (error.code === grpc.status.NOT_FOUND) {
        console.log('Not Found');
      } else {
        console.log('Sorry something went wrong');
      }
    }
  });
}

function callGreetings() {
  console.log('Hello from client');
  const client = new service.GreetServiceClient('localhost:50051', credentials);

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

function getRPCDeadline(rpcType) {
  let timeAllowed = 5000;

  switch (rpcType) {
    case 1:
      timeAllowed = 1000;
      break;
    case 2:
      timeAllowed = 7000;
      break;
    default:
      console.log('Invalid RPC Type: Using Default Timeout');
      break;
  }

  return new Date(Date.now() + timeAllowed);
}

function doErrorCall() {
  let deadline = getRPCDeadline(1);

  // Created our server client
  console.log("Hello, I'm a gRPC Client!");

  const client = new caclService.CalculatorServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  const number = -1;
  const squareRootRequest = new calc.SquareRootRequest();
  squareRootRequest.setNumber(number);

  client.squareRoot(
    squareRootRequest,
    { deadline: deadline },
    (error, response) => {
      if (!error) {
        console.log('Square root is ', response.getNumberRoot());
      } else {
        console.log(error.message);
      }
    }
  );
}

function main() {
  // callListBlogs();
  // callCreateBlog();
  // callReadBlog();
  // callUpdateBlog();
  callDeleteBlog();
  // doErrorCall();
  // callBiDiFindMaximum();
  // callBiDirect();
  // callComputeAverage();
  // callLongGreeting();
  // callPrimeNumberDecomposition();
  // callGreetManyTimes();
  // callGreetings();
  // callSum();
}

main();
