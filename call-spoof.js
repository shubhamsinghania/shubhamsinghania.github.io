const platformClient = require("platformClient");
const clientApp = window.purecloud.apps.ClientApp;
const clientId = "37a8339d-90e6-441d-9cb1-06d3baa257e8";
const redirectUri = "https://shubhamsinghania.github.io";
const client = platformClient.ApiClient.instance;
var conversationsApi = new platformClient.ConversationsApi();
var notificationsApi = new platformClient.NotificationsApi();
var usersApi = new platformClient.UsersApi();

var remoteNumber, dnis, ani, uui, datetime, tz;
var callSpoofApp,
  conversationHandled,
  environment,
  userId,
  conversationId,
  participantId0,
  participantId1,
  channelId,
  socket;

var timeZones = [
  "Africa/Abidjan",
  "Africa/Accra",
  "Africa/Addis_Ababa",
  "Africa/Algiers",
  "Africa/Asmara",
  "Africa/Bamako",
  "Africa/Bangui",
  "Africa/Banjul",
  "Africa/Bissau",
  "Africa/Blantyre",
  "Africa/Brazzaville",
  "Africa/Bujumbura",
  "Africa/Cairo",
  "Africa/Casablanca",
  "Africa/Ceuta",
  "Africa/Conakry",
  "Africa/Dakar",
  "Africa/Dar_es_Salaam",
  "Africa/Djibouti",
  "Africa/Douala",
  "Africa/El_Aaiun",
  "Africa/Freetown",
  "Africa/Gaborone",
  "Africa/Harare",
  "Africa/Johannesburg",
  "Africa/Juba",
  "Africa/Kampala",
  "Africa/Khartoum",
  "Africa/Kigali",
  "Africa/Kinshasa",
  "Africa/Lagos",
  "Africa/Libreville",
  "Africa/Lome",
  "Africa/Luanda",
  "Africa/Lubumbashi",
  "Africa/Lusaka",
  "Africa/Malabo",
  "Africa/Maputo",
  "Africa/Maseru",
  "Africa/Mbabane",
  "Africa/Mogadishu",
  "Africa/Monrovia",
  "Africa/Nairobi",
  "Africa/Ndjamena",
  "Africa/Niamey",
  "Africa/Nouakchott",
  "Africa/Ouagadougou",
  "Africa/Porto-Novo",
  "Africa/Sao_Tome",
  "Africa/Tripoli",
  "Africa/Tunis",
  "Africa/Windhoek",
  "America/Adak",
  "America/Anchorage",
  "America/Anguilla",
  "America/Antigua",
  "America/Araguaina",
  "America/Argentina/Buenos_Aires",
  "America/Argentina/Catamarca",
  "America/Argentina/Cordoba",
  "America/Argentina/Jujuy",
  "America/Argentina/La_Rioja",
  "America/Argentina/Mendoza",
  "America/Argentina/Rio_Gallegos",
  "America/Argentina/Salta",
  "America/Argentina/San_Juan",
  "America/Argentina/San_Luis",
  "America/Argentina/Tucuman",
  "America/Argentina/Ushuaia",
  "America/Aruba",
  "America/Asuncion",
  "America/Atikokan",
  "America/Bahia",
  "America/Bahia_Banderas",
  "America/Barbados",
  "America/Belem",
  "America/Belize",
  "America/Blanc-Sablon",
  "America/Boa_Vista",
  "America/Bogota",
  "America/Boise",
  "America/Cambridge_Bay",
  "America/Campo_Grande",
  "America/Cancun",
  "America/Caracas",
  "America/Cayenne",
  "America/Cayman",
  "America/Chicago",
  "America/Chihuahua",
  "America/Costa_Rica",
  "America/Creston",
  "America/Cuiaba",
  "America/Curacao",
  "America/Danmarkshavn",
  "America/Dawson",
  "America/Dawson_Creek",
  "America/Denver",
  "America/Detroit",
  "America/Dominica",
  "America/Edmonton",
  "America/Eirunepe",
  "America/El_Salvador",
  "America/Fort_Nelson",
  "America/Fortaleza",
  "America/Glace_Bay",
  "America/Goose_Bay",
  "America/Grand_Turk",
  "America/Grenada",
  "America/Guadeloupe",
  "America/Guatemala",
  "America/Guayaquil",
  "America/Guyana",
  "America/Halifax",
  "America/Havana",
  "America/Hermosillo",
  "America/Indiana/Indianapolis",
  "America/Indiana/Knox",
  "America/Indiana/Marengo",
  "America/Indiana/Petersburg",
  "America/Indiana/Tell_City",
  "America/Indiana/Vevay",
  "America/Indiana/Vincennes",
  "America/Indiana/Winamac",
  "America/Inuvik",
  "America/Iqaluit",
  "America/Jamaica",
  "America/Juneau",
  "America/Kentucky/Louisville",
  "America/Kentucky/Monticello",
  "America/Kralendijk",
  "America/La_Paz",
  "America/Lima",
  "America/Los_Angeles",
  "America/Lower_Princes",
  "America/Maceio",
  "America/Managua",
  "America/Manaus",
  "America/Marigot",
  "America/Martinique",
  "America/Matamoros",
  "America/Mazatlan",
  "America/Menominee",
  "America/Merida",
  "America/Metlakatla",
  "America/Mexico_City",
  "America/Miquelon",
  "America/Moncton",
  "America/Monterrey",
  "America/Montevideo",
  "America/Montserrat",
  "America/Nassau",
  "America/New_York",
  "America/Nipigon",
  "America/Nome",
  "America/Noronha",
  "America/North_Dakota/Beulah",
  "America/North_Dakota/Center",
  "America/North_Dakota/New_Salem",
  "America/Nuuk",
  "America/Ojinaga",
  "America/Panama",
  "America/Pangnirtung",
  "America/Paramaribo",
  "America/Phoenix",
  "America/Port-au-Prince",
  "America/Port_of_Spain",
  "America/Porto_Velho",
  "America/Puerto_Rico",
  "America/Punta_Arenas",
  "America/Rainy_River",
  "America/Rankin_Inlet",
  "America/Recife",
  "America/Regina",
  "America/Resolute",
  "America/Rio_Branco",
  "America/Santarem",
  "America/Santiago",
  "America/Santo_Domingo",
  "America/Sao_Paulo",
  "America/Scoresbysund",
  "America/Sitka",
  "America/St_Barthelemy",
  "America/St_Johns",
  "America/St_Kitts",
  "America/St_Lucia",
  "America/St_Thomas",
  "America/St_Vincent",
  "America/Swift_Current",
  "America/Tegucigalpa",
  "America/Thule",
  "America/Thunder_Bay",
  "America/Tijuana",
  "America/Toronto",
  "America/Tortola",
  "America/Vancouver",
  "America/Whitehorse",
  "America/Winnipeg",
  "America/Yakutat",
  "America/Yellowknife",
  "Antarctica/Casey",
  "Antarctica/Davis",
  "Antarctica/DumontDUrville",
  "Antarctica/Macquarie",
  "Antarctica/Mawson",
  "Antarctica/McMurdo",
  "Antarctica/Palmer",
  "Antarctica/Rothera",
  "Antarctica/Syowa",
  "Antarctica/Troll",
  "Antarctica/Vostok",
  "Arctic/Longyearbyen",
  "Asia/Aden",
  "Asia/Almaty",
  "Asia/Amman",
  "Asia/Anadyr",
  "Asia/Aqtau",
  "Asia/Aqtobe",
  "Asia/Ashgabat",
  "Asia/Atyrau",
  "Asia/Baghdad",
  "Asia/Bahrain",
  "Asia/Baku",
  "Asia/Bangkok",
  "Asia/Barnaul",
  "Asia/Beirut",
  "Asia/Bishkek",
  "Asia/Brunei",
  "Asia/Chita",
  "Asia/Choibalsan",
  "Asia/Colombo",
  "Asia/Damascus",
  "Asia/Dhaka",
  "Asia/Dili",
  "Asia/Dubai",
  "Asia/Dushanbe",
  "Asia/Famagusta",
  "Asia/Gaza",
  "Asia/Hebron",
  "Asia/Ho_Chi_Minh",
  "Asia/Hong_Kong",
  "Asia/Hovd",
  "Asia/Irkutsk",
  "Asia/Jakarta",
  "Asia/Jayapura",
  "Asia/Jerusalem",
  "Asia/Kabul",
  "Asia/Kamchatka",
  "Asia/Karachi",
  "Asia/Kathmandu",
  "Asia/Khandyga",
  "Asia/Kolkata",
  "Asia/Krasnoyarsk",
  "Asia/Kuala_Lumpur",
  "Asia/Kuching",
  "Asia/Kuwait",
  "Asia/Macau",
  "Asia/Magadan",
  "Asia/Makassar",
  "Asia/Manila",
  "Asia/Muscat",
  "Asia/Nicosia",
  "Asia/Novokuznetsk",
  "Asia/Novosibirsk",
  "Asia/Omsk",
  "Asia/Oral",
  "Asia/Phnom_Penh",
  "Asia/Pontianak",
  "Asia/Pyongyang",
  "Asia/Qatar",
  "Asia/Qostanay",
  "Asia/Qyzylorda",
  "Asia/Riyadh",
  "Asia/Sakhalin",
  "Asia/Samarkand",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Srednekolymsk",
  "Asia/Taipei",
  "Asia/Tashkent",
  "Asia/Tbilisi",
  "Asia/Tehran",
  "Asia/Thimphu",
  "Asia/Tokyo",
  "Asia/Tomsk",
  "Asia/Ulaanbaatar",
  "Asia/Urumqi",
  "Asia/Ust-Nera",
  "Asia/Vientiane",
  "Asia/Vladivostok",
  "Asia/Yakutsk",
  "Asia/Yangon",
  "Asia/Yekaterinburg",
  "Asia/Yerevan",
  "Atlantic/Azores",
  "Atlantic/Bermuda",
  "Atlantic/Canary",
  "Atlantic/Cape_Verde",
  "Atlantic/Faroe",
  "Atlantic/Madeira",
  "Atlantic/Reykjavik",
  "Atlantic/South_Georgia",
  "Atlantic/St_Helena",
  "Atlantic/Stanley",
  "Australia/Adelaide",
  "Australia/Brisbane",
  "Australia/Broken_Hill",
  "Australia/Darwin",
  "Australia/Eucla",
  "Australia/Hobart",
  "Australia/Lindeman",
  "Australia/Lord_Howe",
  "Australia/Melbourne",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Andorra",
  "Europe/Astrakhan",
  "Europe/Athens",
  "Europe/Belgrade",
  "Europe/Berlin",
  "Europe/Bratislava",
  "Europe/Brussels",
  "Europe/Bucharest",
  "Europe/Budapest",
  "Europe/Busingen",
  "Europe/Chisinau",
  "Europe/Copenhagen",
  "Europe/Dublin",
  "Europe/Gibraltar",
  "Europe/Guernsey",
  "Europe/Helsinki",
  "Europe/Isle_of_Man",
  "Europe/Istanbul",
  "Europe/Jersey",
  "Europe/Kaliningrad",
  "Europe/Kiev",
  "Europe/Kirov",
  "Europe/Lisbon",
  "Europe/Ljubljana",
  "Europe/London",
  "Europe/Luxembourg",
  "Europe/Madrid",
  "Europe/Malta",
  "Europe/Mariehamn",
  "Europe/Minsk",
  "Europe/Monaco",
  "Europe/Moscow",
  "Europe/Oslo",
  "Europe/Paris",
  "Europe/Podgorica",
  "Europe/Prague",
  "Europe/Riga",
  "Europe/Rome",
  "Europe/Samara",
  "Europe/San_Marino",
  "Europe/Sarajevo",
  "Europe/Saratov",
  "Europe/Simferopol",
  "Europe/Skopje",
  "Europe/Sofia",
  "Europe/Stockholm",
  "Europe/Tallinn",
  "Europe/Tirane",
  "Europe/Ulyanovsk",
  "Europe/Uzhgorod",
  "Europe/Vaduz",
  "Europe/Vatican",
  "Europe/Vienna",
  "Europe/Vilnius",
  "Europe/Volgograd",
  "Europe/Warsaw",
  "Europe/Zagreb",
  "Europe/Zaporozhye",
  "Europe/Zurich",
  "Indian/Antananarivo",
  "Indian/Chagos",
  "Indian/Christmas",
  "Indian/Cocos",
  "Indian/Comoro",
  "Indian/Kerguelen",
  "Indian/Mahe",
  "Indian/Maldives",
  "Indian/Mauritius",
  "Indian/Mayotte",
  "Indian/Reunion",
  "Pacific/Apia",
  "Pacific/Auckland",
  "Pacific/Bougainville",
  "Pacific/Chatham",
  "Pacific/Chuuk",
  "Pacific/Easter",
  "Pacific/Efate",
  "Pacific/Fakaofo",
  "Pacific/Fiji",
  "Pacific/Funafuti",
  "Pacific/Galapagos",
  "Pacific/Gambier",
  "Pacific/Guadalcanal",
  "Pacific/Guam",
  "Pacific/Honolulu",
  "Pacific/Kiritimati",
  "Pacific/Kosrae",
  "Pacific/Kwajalein",
  "Pacific/Majuro",
  "Pacific/Marquesas",
  "Pacific/Midway",
  "Pacific/Nauru",
  "Pacific/Niue",
  "Pacific/Norfolk",
  "Pacific/Noumea",
  "Pacific/Pago_Pago",
  "Pacific/Palau",
  "Pacific/Pitcairn",
  "Pacific/Pohnpei",
  "Pacific/Port_Moresby",
  "Pacific/Rarotonga",
  "Pacific/Saipan",
  "Pacific/Tahiti",
  "Pacific/Tarawa",
  "Pacific/Tongatapu",
  "Pacific/Wake",
  "Pacific/Wallis",
];

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
    //pcEnvironmentQueryParam: "environment",
  });

  listTimeZones();

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
  dnis = $("input[name=dnis]").val();
  ani = $("input[name=ani]").val();
  uui = $("input[name=uui]").val();
  datetime = $("input[name=datetime]").val();
  tz = $("select[name=tz]").val();

  conversationHandled = false;

  if (!remoteNumber) {
    alertFailure('A valid phone number must be entered in "My Number."');
    return;
  }

  if (!dnis) {
    alertFailure('A valid phone number must be entered in "Dialed Number."');
    return;
  }

  if (!ani) {
    // Default ANI to dnis. There is a bug in call flows when transferring to voicemail with a SIP ANI.
    // Using remoteNumber here causes the call to fail.
    ani = dnis;
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

function convertDateTime() {
  if (!datetime) {
    return "";
  }

  if (!tz) {
    return datetime;
  }

  return luxon.DateTime.fromISO(datetime, {
    zone: tz,
  })
    .toUTC()
    .toISO();
}

function listTimeZones() {
  var dropdown = $("select[name=tz]");

  dropdown.empty();

  timeZones.forEach((zone) => {
    dropdown.append(new Option(zone));
  });

  dropdown.val(Intl.DateTimeFormat().resolvedOptions().timeZone);
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
  if (!data.eventBody.participants && data.eventBody.participants.length > 1) {
    console.log(
      "[CallSpoof] Ignored notification due to missing conversation participants",
      data
    );
    return;
  }

  // verify all parties connected
  var allConnected = true;
  data.eventBody.participants.forEach((participant) => {
    if (participant.state.toLowerCase() !== "connected") {
      allConnected = false;
    }
  });

  if (!allConnected) {
    console.log(
      "[CallSpoof] Ignored notification due to not all participants being connected yet",
      data
    );
    return;
  }

  // if we got here, that means we should proceed and ignore future notifications.
  participantId0 = data.eventBody.participants[0].id;
  participantId1 = data.eventBody.participants[1].id;
  conversationHandled = true;

  await disconnectWebsocket();
  await setAttributes();
  await replaceParticipant();

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
    phoneNumber: remoteNumber,
    callerId: ani,
    uuiData: uui,
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
      PS_CallSpoof_Ani: ani,
      PS_CallSpoof_DateTime: convertDateTime(),
      PS_CallSpoof_Uui: uui,
    },
  };

  return new Promise((resolve, reject) => {
    conversationsApi
      .patchConversationParticipantAttributes(
        conversationId,
        participantId1,
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

async function replaceParticipant() {
  var body = {
    address: dnis,
  };

  return new Promise((resolve, reject) => {
    conversationsApi
      .postConversationsCallParticipantReplace(
        conversationId,
        participantId0,
        body
      )
      .then((data) => {
        console.log("[CallSpoof] Transferred to desired DNIS");
        resolve();
      })
      .catch((err) => {
        alertFailure("Unable to transfer to the desired DNIS.");
        console.log("[CallSpoof] Unable to replace participant", err);
        reject(err);
      });
  });
}
