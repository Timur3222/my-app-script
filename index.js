"use strict";

window.APP_URL = "http://192.168.1.38:3000/";
// window.APP_KEY = "";
// window.ONESIGNAL_APP_ID = "";

if (window.DEVELOPMENT) {
  window.APP_URL = "http://192.168.1.38:3000/";
  // window.APP_KEY = "OQwUMztSJFBEbJaoald9cnfACEZhM0";
  // window.ONESIGNAL_APP_ID = "cc9fb7a7-6b92-4c53-9844-4506d50f2cbe";
  // alert(`ТЕСТОВЫЙ РЕЖИМ\nAPP_KEY=${window.APP_KEY}\nAPP_URL=${window.APP_URL}`);
  /* window.open(
    "https://api.vsem-edu-oblako.ru/api/script/cordova-test.html"
  ); */
  // window.open("http://192.168.1.38/");
}

// if (window.APP_KEY == "GyaKSXDYfAM7BsgDGwSBkGOrAIy2dx" && monaca.isIOS) {
//   window.APP_URL =
//     "https://app.vsem-edu-oblako.ru/?merchantKey=d22d16e0da156c318999b49bb3a738a7";
// }

let orderId;

document.addEventListener("deviceready", onDeviceReady, false);

async function onDeviceReady() {
  let app;
  navigator.vibrate(40);
  try {
    const appUrl = await getAppUrl();
    app = await openApp(appUrl);
    initOneSignal(app);
    useGeolocation(app);
  } catch (error) {
    if (app) {
      showInAppAlert(app, error.message || error);
    } else {
      alert(error);
    }
  }
}

async function initAppMetrica(app, apiKey) {
  try {
    if (window.AppMetricaActivated) return;

    const config = {
      apiKey: apiKey,
      logs: false,
      locationTracking: false,
    };

    await AppMetrica.activate(config);

    window.AppMetricaActivated = true;

    if (window.DEVELOPMENT) {
      // showInAppAlert(app, `AppMetrica activated ${apiKey}`);
    }
  } catch (error) {
    // alert(error);
  }
}

async function getAppUrl() {
  const url = new URL(window.APP_URL);

  url.searchParams.set("time", new Date().getTime());

  url.searchParams.set("appKey", window.APP_KEY);
  url.searchParams.set("isAndroid", monaca.isAndroid);
  url.searchParams.set("isIOS", monaca.isIOS);
  url.searchParams.set("app", "true");

  const token = await getAuthToken();

  if (token) {
    url.searchParams.set("authToken", token);
  }

  if (orderId) {
    url.pathname = `payment-success/${orderId}`;
    orderId = null;
  }

  return url.toString();
}

async function openApp(url) {
  const options = {
    location: "no",
    hidden: "no",
    toolbar: "no",
    zoom: "no",
    toolbar: "no",
    fullscreen: "no",
    disallowoverscroll: "yes",
    // clearcache: 'yes',
    // clearsessioncache: 'yes',
    // cleardata: "yes",
  };

  const stringifiedOptions = Object.entries(options)
    .map((option) => option.join("="))
    .join(",");

  const app = cordova.InAppBrowser.open(url, "_blank", stringifiedOptions);

  return new Promise((resolve, reject) => {
    app.addEventListener("loadstop", () => {
      resolve(app);
    });
    app.addEventListener("loaderror", (error) => {
      if (error.message !== "The certificate authority is not trusted") {
        reject(
          `Не удалось открыть приложение: ${window.APP_URL} (${error.message})`
        );
      }
    });
    setAppHandlers(app);
  });
}

function initOneSignal(app) {
  let userId;

  if (!plugins.OneSignal) {
    throw new Error("OneSignal плагин не установлен");
  }

  if (!window.ONESIGNAL_APP_ID) {
    throw new Error("ONESIGNAL_APP_ID не задан");
  }

  plugins.OneSignal.setAppId(window.ONESIGNAL_APP_ID);

  plugins.OneSignal.setNotificationWillShowInForegroundHandler(function (
    notificationReceivedEvent
  ) {
    const notification = notificationReceivedEvent.getNotification();
    notificationReceivedEvent.complete(notification);
  });

  plugins.OneSignal.setNotificationOpenedHandler((event) => {
    dispatchEvent(app, "notificationOpened", {
      data: event.notification,
    });

    const additionalData =
      event.notification.payload?.additionalData ||
      event.notification.additionalData ||
      {};

    const externalLink = additionalData.url;

    if (externalLink) {
      const app = cordova.InAppBrowser.open(externalLink, "_system");
      setAppHandlers(app);
    }
  });

  plugins.OneSignal.promptForPushNotificationsWithUserResponse(function (
    accepted
  ) {
    // console.log("User accepted notifications: " + accepted);
  });

  setInterval(() => {
    plugins.OneSignal.getDeviceState(function (state) {
      if (userId != state.userId) {
        userId = state.userId;
        dispatchEvent(app, "onesignal", {
          userId: state.userId,
        });
      }
    });
  }, 1500);
}

async function getAuthToken() {
  return new Promise((resolve) => {
    if (window.AUTH_TOKEN) {
      resolve(window.AUTH_TOKEN);
    } else if (window.NativeStorage) {
      NativeStorage.getItem(
        "authToken",
        (value) => resolve(value),
        () => resolve(localStorage.getItem("authToken"))
      );
    } else {
      resolve(localStorage.getItem("authToken"));
    }
  });
}

function updateAuthToken(value) {
  if (window.NativeStorage) {
    value
      ? NativeStorage.setItem("authToken", value)
      : NativeStorage.remove("authToken");
  }

  value
    ? localStorage.setItem("authToken", value)
    : localStorage.removeItem("authToken");
}

// async function getAuthToken() {
//   return window.AUTH_TOKEN || localStorage.getItem("authToken");
// }

// async function updateAuthToken(value) {
//   if (value) {
//     return localStorage.setItem("authToken", value);
//   } else {
//     return localStorage.removeItem("authToken");
//   }
// }

function setAppHandlers(app) {
  app.addEventListener("exit", () => {
    navigator.app.exitApp();
  });

  app.addEventListener("message", async (event) => {
    try {
      if (event.data.appMetricaKey) {
        initAppMetrica(app, event.data.appMetricaKey);
      }

      if (event.data.type === "AppMetrica" && window.AppMetricaActivated) {
        AppMetrica[event.data.event](...event.data.args);
        /* if (window.DEVELOPMENT) {
          showInAppAlert(
            app,
            `AppMetricaEvent: ${event.data.event} ${JSON.stringify([
              ...event.data.args,
            ])}`
          );
        } */
      }

      if (event.data.action === "reopen") {
        onDeviceReady();
      }

      if (event.data.authToken !== undefined) {
        updateAuthToken(event.data.authToken);
      }

      if (event.data.href) {
        openHref(event.data.href);
      }

      if (event.data.url) {
        openApp(event.data.url);
      }

      if (event.data.orderId) {
        orderId = event.data.orderId;
        onDeviceReady();
      }

      if (event.data.theme == "dark" && monaca.isIOS) {
        try {
          StatusBar.overlaysWebView(false);
          StatusBar.styleLightContent();
          StatusBar.backgroundColorByHexString("#000000");
        } catch (err) {
          //
        }
      }

      if (event.data.color && monaca.isIOS) {
        try {
          StatusBar.overlaysWebView(false);
          StatusBar.styleLightContent();
          StatusBar.backgroundColorByHexString(event.data.color);
        } catch (err) {
          //
        }
      }
    } catch (err) {
      showInAppAlert(app, err.message || err);
    }
  });

  app.addEventListener("loadstop", () => {
    addScripts(app);
  });

  app.addEventListener("loaderror", (error) => {
    // alert(JSON.stringify(error, null, 2));
    if (error.code == -10 || error.message == "net::ERR_UNKNOWN_URL_SCHEME") {
      if (error.url) {
        openHref(error.url);
        onDeviceReady();
      }
    }
  });
}

function openHref(href) {
  const url = new URL(href);
  const bank = url.hash.match(/scheme=(bank\d+)/)?.[1];
  if (bank) {
    url.protocol = bank;
  }
  const app = cordova.InAppBrowser.open(url.toString(), "_system");
  setAppHandlers(app);
}

function showInAppAlert(app, message) {
  app.executeScript({
    code: `
      alert('${message}');
    `,
  });
}

function addScripts(app) {
  if (window.DEVELOPMENT) {
    /* app.insertCSS({
      code: `
      * {
        outline: 1px solid gray !important;
      }
      `,
    }); */
  }

  app.executeScript({
    code: `
      ;(() => {
        if (window.__executeScript) return;
        window.__executeScript = true;
      
        document.body.addEventListener(
          "click",
          function (e) {
            const target = e.target.closest("a");
            if (!target) return;
            const href = target.getAttribute("href");
            if (
              href &&
              (href.startsWith("http") ||
                href.startsWith("tel") ||
                href.startsWith("mailto") ||
                href.startsWith("intent") ||
                href.startsWith("bank")
              )
            ) {
              try {
                const url = new URL(href);
                if (url.host == "vsem-edu-oblako.ru") {
                  return;
                }
              } catch (error) {
                //
              }
              e.preventDefault();
              const messageData = JSON.stringify({
                href: href,
              });
              window.webkit.messageHandlers.cordova_iab.postMessage(messageData);
            }
          },
          { capture: true }
        );

        if (
          window.location.host !== "front.resto-loyalty.ru" &&
          window.location.host !== "catalog.resto-loyalty.ru" &&
          window.location.host !== "app.vsem-edu-oblako.ru"
        ) {
          setTimeout(() => {
            const button = document.createElement("button");
            button.type = "button";
            button.innerText = "Вернуться назад";
            button.style =
              "position:fixed; width: auto; bottom:calc(env(safe-area-inset-bottom,0) + 0px); left:0; max-height:36px; background:rgb(51 51 51 / 90%); color:#fff; z-index:9999; border:transparent; padding: 6px 12px; margin: 0 12px 24px; border-radius: 6px; font-size: 12px; font-weight: 400; box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);";
            button.addEventListener("click", () => {
              const message = JSON.stringify({
                action: "reopen",
              });
              webkit.messageHandlers.cordova_iab.postMessage(message);
            });
            document.body.appendChild(button);
          }, 3000);
        }

      })();
    `,
  });
}

function dispatchEvent(app, eventName, data) {
  app.executeScript({
    code: `
      window.CORDOVA_CUSTOM_EVENTS = window.CORDOVA_CUSTOM_EVENTS || []
      window.CORDOVA_CUSTOM_EVENTS.push({
        name: '${eventName}',
        data: ${JSON.stringify(data)}
      });
      document.dispatchEvent(
        new CustomEvent('cordovaCustomEvent', {
          detail: {
            name: '${eventName}',
            data: ${JSON.stringify(data)}
          },
        })
      );
    `,
  });
}

function useGeolocation(app) {
  navigator.geolocation.getCurrentPosition(onSuccess, null, {
    enableHighAccuracy: true,
  });

  function onSuccess(position) {
    const coords = [position.coords.latitude, position.coords.longitude];
    dispatchEvent(app, "geolocation", {
      coords: coords,
    });
  }
}
