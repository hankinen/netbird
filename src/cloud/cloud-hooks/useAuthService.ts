import { useApiCall } from "@utils/api";
import loadConfig from "@utils/config";
import { EnterpriseConnection } from "@/interfaces/IdentityProvider";

export const useAuthService = () => {
  const accountRequest = useApiCall<EnterpriseConnection[]>(
    "/service/account",
    true,
    {
      origin: loadConfig().authServiceUrl,
    },
  );

  const deleteAccount = async () => {
    return accountRequest.del({});
  };

  return {
    deleteAccount,
  } as const;
};
