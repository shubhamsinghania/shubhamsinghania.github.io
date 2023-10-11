const platformClient = require("platformClient");
const clientApp = window.purecloud.apps.ClientApp;
const clientId = "37a8339d-90e6-441d-9cb1-06d3baa257e8";
const redirectUri = "https://shubhamsinghania.github.io";
const client = platformClient.ApiClient.instance;
var conversationsApi = new platformClient.ConversationsApi();
var notificationsApi = new platformClient.NotificationsApi();
var usersApi = new platformClient.UsersApi();

var remoteNumber;
var callSpoofApp,
  conversationHandled,
  environment,
  userId,
  conversationId,
  participantId0,
  participantId1,
  channelId,
  socket;

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
    placeCall();
  });

  $("#formSubmit").click((e) => {
    e.preventDefault();
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

  if (channelId) {
    // always create a new websocket since we didn't add long-live logic
    // the only situation channelId exists here is when a user places multiple calls at once
    disconnectWebsocket();
  }

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

  // 1. connect websocket and sub to notifications
  await connectWebsocket();

  // 2. place call
  conversationId = await createConversation();

  // 3. upon connect, notification will trigger the remaining requests
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

// Section: Websocket control

async function connectWebsocket() {
  return new Promise((resolve, reject) => {
    notificationsApi
      .postNotificationsChannels()
      .then((data) => {
        channelId = data.id;
        socket = new WebSocket(data.connectUri);
        socket.onmessage = handleMessage;
        socket.onopen = async (event) => {
          console.log("[CallSpoof] Websocket connected", event);
          await addSubscription();
          resolve();
        };
        socket.onclose = (event) => {
          console.log("[CallSpoof] Websocket closed", event);
        };
        socket.onerror = (event) => {
          console.log("[CallSpoof] Websocket error", event);
        };
      })
      .catch((err) => {
        alertFailure("Unable to connect to Genesys Cloud.");
        console.log("[CallSpoof] Unable to connect websocket", err);
        reject(err);
      });
  });
}

async function disconnectWebsocket() {
  return new Promise((resolve, reject) => {
    notificationsApi
      .deleteNotificationsChannelSubscriptions(channelId)
      .then((data) => {
        channelId = "";
        console.log("[CallSpoof] Unsubscribed from notifications");
        if (socket) {
          socket.close();
        }
        resolve();
      })
      .catch((err) => {
        alertFailure("Unable to connect to Genesys Cloud.");
        console.log("[CallSpoof] Unable to disconnect websocket", err);
        reject(err);
      });
  });
}

async function handleMessage(event) {
  if (conversationHandled === true) {
    console.log(
      "[CallSpoof] Ignored notification due to conversation already handled",
      event
    );
    return;
  }

  if (!event.data) {
    console.log(
      "[CallSpoof] Ignored notification due to missing payload",
      event
    );
    return;
  }

  let data = JSON.parse(event.data);
  console.log("[CallSpoof] Websocket received message", data);

  // check if correct topic
  if (data.topicName !== `v2.users.${userId}.conversations.calls`) {
    console.log("[CallSpoof] Ignored notification for another topic", data);
    return;
  }

  // check conversation id
  if (!data.eventBody) {
    console.log(
      "[CallSpoof] Ignored notification due to missing conversation body",
      data
    );
    return;
  }

  if (data.eventBody.id !== conversationId) {
    console.log(
      "[CallSpoof] Ignored notification for another conversation",
      data
    );
    return;
  }

  // check if participants exist
  if (!data.eventBody.participants) {
    console.log(
      "[CallSpoof] Ignored notification due to missing conversation participants",
      data
    );
    return;
  }


  // if we got here, that means we should proceed and ignore future notifications.
  participantId0 = data.eventBody.participants[0].id;
  conversationHandled = true;
  await disconnectWebsocket();
  await setAttributes();

  // we made it! success!
  var options = {
    id: "callSpoofNotify",
    type: "success",
    timeout: 5,
  };
  callSpoofApp.alerting.showToastPopup(
    "Call Spoof",
    "Successfully simulated call.",
    options
  );
}

async function addSubscription() {
  // subscribe to my conversations
  return new Promise((resolve, reject) => {
    notificationsApi
      .putNotificationsChannelSubscriptions(channelId, [
        `v2.users.${userId}.conversations.calls`,
      ])
      .then((data) => {
        console.log("[CallSpoof] Subscribed to notifications");
        resolve();
      })
      .catch((err) => {
        alertFailure("Unable to subscribe to conversation notifications.");
        console.log("[CallSpoof] Unable to set notification subscription", err);
        reject(err);
      });
  });
}

// Section: Conversation control

async function createConversation() {
  var body = {
		phoneNumber:"DialOut@localhost",
		callFromQueueId:"19fe3246-f90d-4381-b048-c9884bef1c8f",
	        uuiData:"test"  
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

async function setAttributes() {
  var body = {
    attributes: {
      Customer_Number: remoteNumber
    },
  };

  return new Promise((resolve, reject) => {
    conversationsApi
      .patchConversationParticipantAttributes(
        conversationId,
        participantId0,
        body
      )
      .then((data) => {
        console.log("[CallSpoof] Set participant attributes", data);
        resolve();
      })
      .catch((err) => {
        alertFailure("Unable to set participant attributes.");
        console.log("[CallSpoof] Unable to update participant attributes", err);
        reject(err);
      });
  });
}
