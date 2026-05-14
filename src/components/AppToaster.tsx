import { useEffect } from "react";
import { Toaster, useToastController } from "@fluentui/react-components";
import {
  APP_TOASTER_ID,
  makeToastContent,
  notifyError,
  notifySuccess,
  registerToastDispatcher,
  unregisterToastDispatcher,
} from "../lib/notifications";

export const AppToaster = (): JSX.Element => {
  const { dispatchToast } = useToastController(APP_TOASTER_ID);

  useEffect(() => {
    registerToastDispatcher((message, intent) => {
      dispatchToast(makeToastContent(message), { intent });
    });

    return () => {
      unregisterToastDispatcher();
    };
  }, [dispatchToast]);

  useEffect(() => {
    const onOffline = (): void => notifyError("オフラインです。接続を確認してください。");
    const onOnline = (): void => notifySuccess("オンラインに復帰しました。");

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return (
    <Toaster
      toasterId={APP_TOASTER_ID}
      position="top-end"
      limit={3}
      timeout={3500}
      pauseOnHover
      pauseOnWindowBlur
    />
  );
};
