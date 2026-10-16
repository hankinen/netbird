import { notify } from "@components/Notification";
import { useApiCall } from "@utils/api";
import { useReducer } from "react";
import { useSWRConfig } from "swr";
import { t } from "@/i18n";
import { PostureCheck } from "@/interfaces/PostureCheck";
import {
  validateLocationCheck,
  validateOSCheck,
} from "@/modules/posture-checks/helper/PostureCheckHelper";
// Posture Check Reducer Type
type PostureCheckReducerType = {
  state: PostureCheck;
  action: any;
};

interface PostureCheckAction {
  type:
    | "name"
    | "description"
    | "version"
    | "location"
    | "os"
    | "network_range"
    | "process_check"
    | "certificate_check";
  payload: any;
}

const postureCheckReducer = (
  state: PostureCheck,
  action: PostureCheckAction,
): PostureCheck => {
  switch (action.type) {
    case "name":
      return { ...state, name: action.payload };
    case "description":
      return { ...state, description: action.payload };
    case "version":
      return {
        ...state,
        checks: {
          ...state.checks,
          nb_version_check: action.payload,
        },
      };
    case "location":
      return {
        ...state,
        checks: {
          ...state.checks,
          geo_location_check: validateLocationCheck(action.payload),
        },
      };

    case "os":
      return {
        ...state,
        checks: {
          ...state.checks,
          os_version_check: validateOSCheck(action.payload),
        },
      };

    case "network_range":
      return {
        ...state,
        checks: {
          ...state.checks,
          peer_network_range_check: action.payload,
        },
      };

    case "process_check":
      return {
        ...state,
        checks: {
          ...state.checks,
          process_check: action.payload,
        },
      };

    case "certificate_check":
      return {
        ...state,
        checks: {
          ...state.checks,
          certificate_check: action.payload,
        },
      };

    default:
      return state;
  }
};

type Props = {
  postureCheck?: PostureCheck;
  onSuccess?: (check: PostureCheck) => void;
};
export const usePostureCheck = ({ postureCheck, onSuccess }: Props = {}) => {
  const postureCheckRequest = useApiCall<PostureCheck>("/posture-checks", true);
  const { mutate } = useSWRConfig();
  const [state, dispatch] = useReducer(
    postureCheckReducer,
    postureCheck || {
      id: "",
      name: "",
      description: "",
      checks: {
        nb_version_check: undefined,
        geo_location_check: undefined,
        os_version_check: undefined,
        peer_network_range_check: undefined,
      },
    },
  );

  const updateOrCreate = (check: PostureCheck): Promise<PostureCheck> => {
    const hasID = check?.id !== "" && check?.id !== undefined;
    const withoutID = { ...check, id: undefined };
    return !hasID
      ? postureCheckRequest.post(withoutID)
      : postureCheckRequest.put(check, `/${check.id}`);
  };

  const updateOrCreateAndNotify = async (
    checkToUpdateOrCreate?: PostureCheck,
  ) => {
    const call = () => updateOrCreate(checkToUpdateOrCreate || state);
    const promise = call().then((check) => {
      mutate("/posture-checks");
      onSuccess && onSuccess(check);
      return check;
    });
    notify({
      title: t("posture-checks.main:usePostureCheck.title.postureCheck", {
        name: state.name,
      }),
      description: postureCheck
        ? t(
            "posture-checks.main:usePostureCheck.description.postureCheckWasSuccessfullyUpdated",
          )
        : t(
            "posture-checks.main:usePostureCheck.description.postureCheckWasSuccessfullyCreated",
          ),
      loadingMessage: postureCheck
        ? t(
            "posture-checks.main:usePostureCheck.loadingMessage.yourPostureCheckUpdating",
          )
        : t(
            "posture-checks.main:usePostureCheck.loadingMessage.yourPostureCheckCreating",
          ),
      promise,
    });
    return promise;
  };

  return { state, dispatch, updateOrCreateAndNotify, updateOrCreate };
};
