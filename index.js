window.DATA = {
  redirects: [
    {
      from: "https://xn--h1aidjt1d.xn--p1ai",
      to: "https://api.vsem-edu-oblako.ru/api/script/need-update-app.php",
      platform: "",
    },
    {
      from: "https://demo-dc.vsem-edu.ru",
      to: "https://delivery-cube.vsem-edu.ru",
      platform: "",
    },
    {
      from: "https://sushistarshop.ru",
      to: "https://sushistar27.ru",
      platform: "",
    },
    {
      from: "https://idi-suda.ve-oblako.ru",
      to: "https://idi-suda.com",
      platform: "",
    },
    {
      from: "https://idi-suda.ve-oblako.ru/",
      to: "https://idi-suda.com",
      platform: "",
    },
    {
      from: "https://xn-----6kcahckcej1banehb4cf1dnh5a5p.xn--p1ai/",
      to: "https://xn-----6kcahckcej1banehb4cf1dnh5a5p.xn--p1ai",
      platform: "",
    },
    {
      from: "http://luigispizza.ru",
      to: "https://luigis-pizza.ru",
      platform: "",
    },
    {
      from: "https://luigispizza.ru",
      to: "https://luigis-pizza.ru",
      platform: "",
    },
    {
      from: "https://app.vsem-edu-oblako.ru?merchantKey=a5579f4240c7836b7e77d0e71e76f094",
      to: "https://ddd.md",
      platform: "",
    },
    {
      from: "https://app.vsem-edu-oblako.ru?merchantKey=d3370f8cddd2ba5edc91de1017841f56",
      to: "https://app.vsem-edu-oblako.ru?merchantKey=6be77015e90108fda45c894f345a5769",
      platform: "",
    },
    { from: "https://perkcafe.ru/", to: "http://prkapp.ru/", platform: "" },
    {
      from: "https://app.vsem-edu-oblako.ru?merchantKey=5694aaf0881225dc60ba8a82910ee130",
      to: "https://app.vsem-edu-oblako.ru?merchantKey=7403e844bfd30159a1dc2431c5b1a7ae",
      platform: "",
    },
  ],
};
const IS_DEV = true;
const MODERATION = window.MODERATION;
document.addEventListener("deviceready", onDeviceReady, false);
window.onesignal = typeof onesignal === "undefined" ? null : onesignal;

function onDeviceReady() {
  let APP_URL = site.trim().replace(/\/+$/, "");

  if (APP_URL == "https://hoshinowa.ru" && window.DEVELOPMENT) {
    APP_URL = "http://192.168.1.46:3000/";
  }

  // alert(window.onesignal);

  // alert(APP_URL);

  if (IS_DEV) {
    APP_URL = "http://192.168.1.38:3000/";
    alert(`window.DEVELOPMENT ${APP_URL}`);
  }

  if (MODERATION == 1) {
    APP_URL =
      "https://app.vsem-edu-oblako.ru/?merchantKey=e6ba19487d2f95cb4e18682a0268fcb4";
  }

  if (APP_URL === "https://developer.ve-oblako.ru" && debug) {
    APP_URL = "http://192.168.1.38:8081/";
  }

  if (APP_URL === "https://sushigourmet.ru" && device.platform === "iOS") {
    try {
      StatusBar.overlaysWebView(false);
      StatusBar.styleLightContent();
      StatusBar.backgroundColorByHexString("#3e4146");
    } catch (err) {
      //
    }
  }

  // if (APP_URL === "https://app.vsem-edu-oblako.ru?merchantKey=b27447ba613046d3659f9730ccf15e3c") {
  //   APP_URL = "https://api.vsem-edu-oblako.ru/api/script/need-update-app.php";
  // }

  try {
    if (window.DATA && Array.isArray(window.DATA.redirects)) {
      for (let i = 0; i < window.DATA.redirects.length; i++) {
        const item = window.DATA.redirects[i] || {};

        if (item.platform && item.platform !== device.platform) continue;

        const from = item.from.replace(/\/+$/, "");

        if (APP_URL === from) {
          APP_URL = item.to;
        }
      }
    }
  } finally {
    const app = new App(APP_URL);
    app.run();
  }
}

function App(appUrl) {
  this.appUrl = appUrl;
  this.OneSignal = window.plugins.OneSignal;
  this.fcmToken = null;

  this.exit = false;
  this.run = () => {
    Promise.all([this.fetchOneSignalToken(this.appUrl), this.openAppUrl()])
      .then(this.initOneSignal)
      .catch((error) => {
        // alert(error.message || error);
        console.error(error);
      });
  };

  this.openAppUrl = () => {
    if (!cordova.InAppBrowser) {
      alert("Не установлен Cordova плагин InAppBrowser");
    }

    if (!(device && device.platform)) {
      alert("Не удалось определить платформу устройства");
    }

    /* fetch("https://api.vsem-edu-oblako.ru/api/script/log.php", {
      method: "POST",
      body: JSON.stringify({
        app: appUrl,
        platform: device.platform
      }),
    }); */

    const params = {
      app: true,
      platform: device.platform,
      uuid: device.uuid,
      time: new Date().getTime(),
    };

    const url = [this.appUrl, new URLSearchParams(params)].join(
      this.appUrl.includes("?") ? "&" : "?"
    );
    const target = "_blank";
    const options = "location=no,hidden=no,toolbar=no,zoom=no";
    // "location=no,hidden=yes,toolbar=no, toolbarposition=bottom,closebuttoncaption=Назад,toolbarcolor=#83cd26,closebuttoncolor=#ffffff,zoom=no,hideurlbar=yes,hidenavigationbuttons=yes";
    this.app = cordova.InAppBrowser.open(url, target, options);

    return new Promise((resolve, reject) => {
      this.app.addEventListener("loaderror", (error) => {
        reject(error);
      });

      this.app.addEventListener("loadstop", () => {
        resolve();

        this.app.show();

        if (this.fcmToken) {
          this.dispatchCordovaEvent("fcmToken", {
            value: this.fcmToken,
          });
        }
      });

      this.appEvents();
    });
  };

  this.fetchOneSignalToken = (domain) => {
    const url = "https://vsem-edu-oblako.ru/singlemerchant/api/";

    const params = {
      json: true,
      domain: domain.trim(),
    };

    return fetch([url, new URLSearchParams(params)].join("?"))
      .then((response) => response.json())
      .then((data) => {
        const token = data.details.id;

        if (!token) {
          return Promise.reject(new Error(data.msg));
        }

        this.oneSignalToken = token;
        this.projectId = data.details.projectid;
        // alert(this.projectId);

        const yandexAppMetricaKey = data.details.yandex_app_metrica;

        if (yandexAppMetricaKey && window.appMetrica) {
          try {
            var configuration = {
              apiKey: yandexAppMetricaKey,
              locationTracking: true,
            };
            window.appMetrica.activate(configuration);
            // window.appMetrica.reportEvent("Hello");
          } catch (err) {
            // alert(err);
          }
        }

        return token;
      });
  };

  this.initOneSignal = () => {
    if (monaca.isAndroid && this.projectId && window.rustore) {
      RuStorePush.init({
        projectId: this.projectId,
      }).then(() => {
        setInterval(() => {
          RuStorePush.getToken()
            .then((r) => {
              if (r.token) {
                this.dispatchCordovaEvent("playerId", {
                  value: r.token,
                  provider: "ru",
                });
              }
            })
            .catch((e) => alert(e));
        }, 1000);
      });
    } else if (onesignal && onesignal >= 3) {
      this.OneSignal.setAppId(this.oneSignalToken);
      this.OneSignal.setNotificationOpenedHandler(this.onNofificationOpened);
      this.OneSignal.setInAppMessageClickHandler(this.onNotificationReceived);

      this.OneSignal.setNotificationWillShowInForegroundHandler(function (
        notificationReceivedEvent
      ) {
        notificationReceivedEvent.complete(
          notificationReceivedEvent.notification
        );
      });

      this.OneSignal.promptForPushNotificationsWithUserResponse(function (
        accepted
      ) {
        // console.log("User accepted notifications: " + accepted);
      });
    } else {
      this.OneSignal.startInit(this.oneSignalToken)
        .inFocusDisplaying(this.OneSignal.OSInFocusDisplayOption.Notification)
        .handleNotificationReceived(this.onNotificationReceived)
        .handleNotificationOpened(this.onNofificationOpened)
        .endInit();
    }

    const loop = setInterval(() => {
      if (onesignal && onesignal >= 3) {
        this.OneSignal.getDeviceState((stateChanges) => {
          if (stateChanges.userId) {
            // clearInterval(loop);
            this.dispatchCordovaEvent("playerId", {
              value: stateChanges.userId,
            });
          }
        });
      } else {
        this.OneSignal.getPermissionSubscriptionState((status) => {
          const userId = status.subscriptionStatus.userId;
          if (userId) {
            clearInterval(loop);
            this.dispatchCordovaEvent("playerId", {
              value: userId,
            });
          }
        });
      }
    }, 1000);

    if (onesignal && onesignal >= 3) {
      this.OneSignal.getDeviceState((stateChanges) => {
        if (stateChanges.pushToken) {
          this.fcmToken = stateChanges.pushToken;
          this.dispatchCordovaEvent("fcmToken", {
            value: stateChanges.pushToken,
          });
        }
      });
    } else {
      this.OneSignal.getPermissionSubscriptionState((status) => {
        const pushToken = status.subscriptionStatus.pushToken;
        if (pushToken) {
          this.fcmToken = pushToken;
          this.dispatchCordovaEvent("fcmToken", {
            value: pushToken,
          });
        }
      });
    }
  };

  this.setCustomId = (id) => {
    this.OneSignal.setExternalUserId(id, (results) => {
      alert(JSON.stringify(results));
    });
  };

  this.onNotificationReceived = (data) => {
    // alert(JSON.stringify(data));
  };

  this.onNofificationOpened = (data) => {
    const link =
      data.notification?.payload?.additionalData?.one_direction_link ||
      data.notification?.additionalData?.one_direction_link;

    if (link) {
      this.dispatchCordovaEvent("route", {
        path: link,
      });
    }

    const externalLink =
      data.notification?.payload?.additionalData?.external_link ||
      data.notification?.additionalData?.external_link;

    if (externalLink) {
      this.app = cordova.InAppBrowser.open(externalLink, "_system");
      this.appEvents();
    }

    this.dispatchCordovaEvent("notificationOpened", {
      notification:
        onesignal && onesignal >= 3
          ? data.notification
          : data.notification.payload,
    });
  };

  this.dispatchCordovaEvent = (eventName, data) => {
    const code = `
      window.dispatchEvent(
        new CustomEvent("cordovaEvent", {
          detail: {
            name: "${eventName}",
            data: ${JSON.stringify(data)}
          },
        })
      );
    `;

    this.app.executeScript({ code: code });
  };

  this.handleAppMessage = (message) => {
    const messageData = message.data.data;

    switch (message.data.type) {
      case "vibration":
        navigator.vibrate(1000);
      case "payment":
        this.paymentInit(messageData.request);
        break;

      case "close":
        this.app.close();
        break;

      case "open":
        this.app = cordova.InAppBrowser.open(
          messageData.url,
          messageData.target,
          "location=no,hidden=no,toolbar=no,zoom=no"
          // "location=no,hidden=no,toolbar=yes,toolbarposition=top,closebuttoncaption=Назад,toolbarcolor=#83cd26,closebuttoncolor=#ffffff,zoom=no,hideurlbar=yes,hidenavigationbuttons=yes"
        );

        this.appEvents();

        this.app.addEventListener("loadstop", (event) => {
          // alert(JSON.stringify(event));

          this.app.executeScript({
            code: `
              ;(() => {
                if (window.__executeScript) return;
                window.__executeScript = true;
              
                if (
                  window.location.host !== "app.vsem-edu-oblako.ru" &&
                  !window.location.host.includes("tinkoff---")
                ) {
                  setTimeout(() => {
                    const button = document.createElement("button");
                    button.innerText = "Вернуться назад";
                    button.style =
                    "position:fixed; width: auto; bottom:env(safe-area-inset-bottom,0); left:0; height:30px; line-height: 30px; background:#333; color:#fff; z-index:9999999; border: 0px solid transparent; padding: 0 10px; margin: 4px; border-radius: 3px; font-size: 14px;";
                    button.addEventListener("click", () => {
                      const stringifiedMessageObj = JSON.stringify({
                        type: "close",
                      });
                      webkit.messageHandlers.cordova_iab.postMessage(stringifiedMessageObj);
                    });
                    document.body.appendChild(button);
                    // document.body.style.paddingBottom = "0px";
                  }, 3000);
                }

                document.body.addEventListener(
                  "click",
                  function (e) {
                    const target = e.target.closest("a");
                    if (!target) return;
                    const href = target.getAttribute("href");
                    if (href && (href.startsWith("intent") || href.startsWith("bank")) ) {
                      e.preventDefault();
                      const messageData = JSON.stringify({
                        type: "bank",
                        data: {
                          href: href,
                        }
                      });
                      window.webkit.messageHandlers.cordova_iab.postMessage(messageData);
                    }
                  },
                  { capture: true }
                );
              })();
            `,
          });
        });

        break;

      case "bank":
        this.openHref(messageData.href);

        break;

      default:
        break;
    }
  };

  this.paymentInit = (request) => {
    cordova.plugins.ApplePayGooglePay.canMakePayments((available) => {
      if (!available) {
        alert("Оплата не доступна");
      }
    });

    cordova.plugins.ApplePayGooglePay.makePaymentRequest(
      request,
      (responseString) => {
        // const paymentData = JSON.parse(responseString);
        this.dispatchCordovaEvent("paymentToken", {
          value: responseString,
          // value: paymentData.paymentMethodData.tokenizationData.token,
        });
        // in success callback, raw response as encoded JSON is returned. Pass it to your payment processor as is.
      },
      (error) => {
        if (error) {
          this.dispatchCordovaEvent("toast", {
            message: JSON.stringify(error),
            type: "error",
          });
        }
        // in error callback, error message is returned.
        // it will be "Payment cancelled" if used pressed Cancel button.
      }
    );
  };

  this.openHref = (href) => {
    const url = new URL(href);
    const bank = url.hash.match(/scheme=(bank\d+)/)?.[1];
    if (bank) {
      url.protocol = bank;
    }
    this.app = cordova.InAppBrowser.open(url.toString(), "_system");
    this.appEvents();
  };

  this.appEvents = () => {
    this.app.addEventListener("message", (event) => {
      this.handleAppMessage(event);
    });

    this.app.addEventListener("exit", this.onExit);

    this.app.addEventListener("loaderror", (error) => {
      // alert(JSON.stringify(error, null, 2));

      if (
        error.code === -2 ||
        error.message == "net::ERR_INTERNET_DISCONNECTED"
      ) {
        this.app.removeEventListener("exit", this.onExit);
        this.app.close();
        document.querySelector(".loader").style.display = "none";
        document.querySelector(".retry").style.display = "block";
        document.querySelector(".retry button").onclick = () => {
          document.querySelector(".loader").style.display = "block";
          document.querySelector(".retry").style.display = "none";
          this.openAppUrl();
        };
      }

      if (error.code == -10 || error.message == "net::ERR_UNKNOWN_URL_SCHEME") {
        if (error.url) {
          this.openHref(error.url);
          this.openAppUrl();
        }
      }

      // -10
      // net::ERR_UNKNOWN_URL_SCHEME
    });
  };

  this.onExit = () => {
    setTimeout(() => {
      this.openAppUrl();
    }, 500);
  };
}

async function openInDev() {
  // window.cordova.InAppBrowser.open("https://bodo.vsem-edu-oblako.ru/", "_self");

  /*  window.cordova.InAppBrowser.open(
    "https://securepayments.tinkoff.ru/FzaMxK8e",
  ); */

  // window.location.href = "https://securepayments.tinkoff.ru/FzaMxK8e";

  // alert(location.href);

  // window.location.href = "http://192.168.1.46:5500/index.html";

  /* Array.from(document.getElementsByTagName("script")).forEach((el) => {
    alert(el.src);
  }); */

  // window.addEventListener("cordovacallbackerror", function (event) {
  //   alert(event.error);
  // });

  alert("test");
}
