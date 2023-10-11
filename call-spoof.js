const platformClient = require("platformClient");
const clientApp = window.purecloud.apps.ClientApp;
const clientId = "37a8339d-90e6-441d-9cb1-06d3baa257e8";
const redirectUri = "https://shubhamsinghania.github.io";
const client = platformClient.ApiClient.instance;
var conversationsApi = new platformClient.ConversationsApi();
var notificationsApi = new platformClient.NotificationsApi();
var apiInstance = new platformClient.ArchitectApi();
var usersApi = new platformClient.UsersApi();

var remoteNumber;
var i=1;
var callSpoofApp,
  environment,
  userId,
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
    pcEnvironmentQueryParam: "environment",
  });

  userId = await getUserId();

  $("#form").submit((e) => {
    e.preventDefault();
    callWorkflow();
    checkWorkflow();
    placeCall();
  });

  $("#formSubmit").click((e) => {
    e.preventDefault();
    callWorkflow();
    checkWorkflow();
    placeCall();
  });

  // show the form
  $("#main-app").removeClass("hidden");
  $("#loading").addClass("hidden");
}

// Section: Helpers

async function getUserId() {
  return new Promise((resolve, reject) => {
    usersApi
      .getUsersMe()
      .then((data) => {
        resolve(data.id);
      })
      .catch((err) => {
        // not logged in!
        console.log("[CallSpoof] Unable to get current user", err);
        bootstrapError();
        reject(err);
      });
  });
}

async function placeCall() {
  remoteNumber = $("input[name=remoteNumber]").val();
  conversationHandled = false;

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

  conversationId = await createConversation();
}

function callWorkflow() {
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
  apiInstance.postFlowsExecutions(flowLaunchRequest)
    .then((data) => {
      console.log(`postFlowsExecutions success! data: ${JSON.stringify(data, null, 2)}`);
      executionId = data.id;
    })
    .catch((err) => {
      console.log("There was a failure calling postFlowsExecutions");
      console.error(err);
    });
  
}

function checkWorkflow() {
  
  // Launch an instance of a flow definition, for flow types that support it such as the 'workflow' type.
  apiInstance.getFlowsExecution(executionId)
  .then((data) => {
    console.log(`getFlowsExecution success! data: ${JSON.stringify(data, null, 2)}`);
  })
  .catch((err) => {
    console.log("There was a failure calling getFlowsExecution");
    console.error(err);
  });
  
}

function checkWorkflow() {     
  setTimeout(function() {   
    console.log('hello');  
      // Launch an instance of a flow definition, for flow types that support it such as the 'workflow' type.
      apiInstance.getFlowsExecution(executionId)
      .then((data) => {
        console.log(`getFlowsExecution success! data: ${JSON.stringify(data, null, 2)}`);
        executionStatus = data.status;
      })
      .catch((err) => {
        console.log("There was a failure calling getFlowsExecution");
        console.error(err);
      });

    i++;                    
    if (i < 3 && executionStatus != "COMPLETED") {           
      checkWorkflow();             
    }                       
  }, 3000)


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

async function createConversation() {
  var body = {
		phoneNumber:"DialOut@localhost",
		callFromQueueId:"19fe3246-f90d-4381-b048-c9884bef1c8f",
	        uuiData:remoteNumber,
	        callerId:"+15153770517"
  };

  return new Promise((resolve, reject) => {
    conversationsApi
      .postConversationsCalls(body)
      .then((data) => {
        console.log("[CallSpoof] Conversation created", data);
        resolve(data.id);
      })
      .catch((err) => {
        alertFailure("Unable to create the conversation.");
        console.log("[CallSpoof] Unable to create conversation", err);
        reject(err);
      });
  });
}
