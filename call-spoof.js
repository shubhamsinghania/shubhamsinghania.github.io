const platformClient = require("platformClient");
const clientApp = window.purecloud.apps.ClientApp;
const clientId = "37a8339d-90e6-441d-9cb1-06d3baa257e8";
const redirectUri = "https://shubhamsinghania.github.io";
const client = platformClient.ApiClient.instance;
var conversationsApi = new platformClient.ConversationsApi();
var apiInstance = new platformClient.ArchitectApi();
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

var remoteNumber;
var i=1;
var callSpoofApp,
  environment,
  executionId,
  executionStatus;

// upgrade to https
if (location.protocol !== "https:") {
  location.replace(
    `https:${location.href.substring(location.protocol.length)}`
  );
}

// authenticate!
setRegion();
client.setPersistSettings(true, "callspoof");
client
  .loginImplicitGrant(clientId, redirectUri, { state: environment })
  .then((data) => {
    // Do authenticated things
    bootstrap(data.state);
  })
  .catch((err) => {
    // Handle failure response
    console.error(err);
    bootstrapError();
  });

// Section: Bootstrap

function bootstrapError() {
  $("#main-app").addClass("hidden");
  $("#loading").addClass("hidden");
  $("#auth-failure").removeClass("hidden");
}

async function bootstrap(data) {
  // put things back in the URL in case the user reloads
  if (data) {
    history.pushState({}, "Call Spoof", "?environment=" + data);
  }

  // set up client app
  callSpoofApp = new clientApp({
    pcEnvironmentQueryParam: "environment"
  });


  $("#form").submit(async (e) => {
    e.preventDefault();
    await callWorkflow();
    await sleep(3000);
    await checkWorkflow();

    if (executionStatus!="COMPLETED") {
      await sleep(4000);
      placeCall();
    }
    else
    {
      placeCall();
    }
  });

  $("#formSubmit").click(async (e) => {
    e.preventDefault();
    await callWorkflow();
    await sleep(10000);
    await checkWorkflow();
    if (executionStatus!="COMPLETED") {
      await sleep(4000);
      placeCall();
    }
    else
    {
      placeCall();
    }
  });

  // show the form
  $("#main-app").removeClass("hidden");
  $("#loading").addClass("hidden");
}



function placeCall() {
  remoteNumber = $("input[name=remoteNumber]").val();

  if (!remoteNumber) {
    alertFailure('A valid phone number must be entered in "My Number."');
    return;
  }

  debounce();

  // show alert
  var options = {
    id: "callSpoofNotify",
    type: "info",
    timeout: 30,
    markdownMessage: true,
  };
  callSpoofApp.alerting.showToastPopup(
    "Call Spoof",
    `Placing call to **${remoteNumber}**...`,
    options
  );

  createConversation();
}

async function callWorkflow() {
  //client.setAccessToken("your_access_token");

  //let apiInstance = new platformClient.ArchitectApi();
  
  let flowLaunchRequest = {
    flowId:"71d3e4ea-0c54-48db-a29f-992bfc710614",
    name:"test",
    inputData: {
      "Flow.InputVariable": "abc"
    }
  }; 
  
  // Launch an instance of a flow definition, for flow types that support it such as the 'workflow' type.
  return new Promise((resolve, reject) => {
    apiInstance.postFlowsExecutions(flowLaunchRequest)
      .then((data) => {
        console.log(`postFlowsExecutions success! data: ${JSON.stringify(data, null, 2)}`);
        executionId = data.id;
        resolve(data.id);
      })
      .catch((err) => {
        console.log("There was a failure calling postFlowsExecutions");
        console.error(err);
        reject(err);
      });
    });
}

async function checkWorkflow() {     
  return new Promise((resolve, reject) => {  
      // Launch an instance of a flow definition, for flow types that support it such as the 'workflow' type.
      apiInstance.getFlowsExecution(executionId)
      .then((data) => {
        console.log(`getFlowsExecution success! data: ${JSON.stringify(data, null, 2)}`);
        executionStatus = data.status;
        resolve(executionStatus);
      })
      .catch((err) => {
        console.log("There was a failure calling getFlowsExecution");
        console.error(err);
        reject(err);
      });
    });
}

function alertFailure(message) {
  var options = {
    id: "callSpoofNotify",
    type: "error",
    showCloseButton: true,
  };
  callSpoofApp.alerting.showToastPopup("Call Spoof Error", message, options);
}

function debounce() {
  $("#formSubmit").prop("disabled", true);

  setTimeout(() => {
    $("#formSubmit").prop("disabled", false);
  }, 2000);
}

function setRegion() {
  let urlParams = new URLSearchParams(window.location.search);
  let envQuery = urlParams.get("environment");
  let state = getParameterByName("state");

  if (envQuery) {
    environment = envQuery;
  } else if (state) {
    environment = state;
  } else {
    environment = "mypurecloud.com";
  }

  client.setEnvironment(environment);
}

// used to get values from the auth hash
function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\#&]" + name + "=([^&#]*)"),
    results = regex.exec(location.hash);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}


// Section: Conversation control

function createConversation() {
  var body = {
		phoneNumber:remoteNumber,
		callFromQueueId:"19fe3246-f90d-4381-b048-c9884bef1c8f"
  };

    conversationsApi.postConversationsCalls(body)
      .then((data) => {
        console.log("[CallSpoof] Conversation created", data);
      })
      .catch((err) => {
        alertFailure("Unable to create the conversation.");
        console.log("[CallSpoof] Unable to create conversation", err);
      });
}
