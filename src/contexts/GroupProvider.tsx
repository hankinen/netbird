import { notify } from "@components/Notification";
import { useApiCall } from "@utils/api";
import * as React from "react";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { useGroups } from "@/contexts/GroupsProvider";
import { usePermissions } from "@/contexts/PermissionsProvider";
import { t } from "@/i18n";
import { Group } from "@/interfaces/Group";
import { Peer } from "@/interfaces/Peer";
import { User } from "@/interfaces/User";
import { EditGroupNameModal } from "@/modules/groups/EditGroupNameModal";
import { useGroupIdentification } from "@/modules/groups/useGroupIdentification";
type Props = {
  group: Group;
  children?: React.ReactNode;
  isDetailPage?: boolean;
};

const GroupContext = React.createContext(
  {} as {
    group: Group;
    deleteGroup: () => Promise<void>;
    renameGroup: (name: string) => Promise<void>;
    isRegularGroup: boolean;
    isIntegrationGroup: boolean;
    isJWTGroup: boolean;
    isAllowedToDelete: boolean;
    isAllowedToRename: boolean;
    openGroupRenameModal?: () => void;
    addPeersToGroup: (peers: Peer[]) => Promise<void>;
    removePeersFromGroup: (peer: Peer[]) => Promise<void>;
    addUsersToGroup: (users: User[]) => Promise<void>;
    removeUsersFromGroup: (users: User[]) => Promise<void>;
  },
);

export const GroupProvider = ({
  group,
  children,
  isDetailPage = true,
}: Props) => {
  const { permission } = usePermissions();
  const [groupNameModal, setGroupNameModal] = useState(false);
  const { mutate } = useSWRConfig();
  const { deleteGroupDropdownOption, updateGroupDropdown } = useGroups();
  const groupRequest = useApiCall<Group>("/groups/" + group.id);
  const userRequest = useApiCall<User>("/users");
  const { confirm } = useDialog();
  const { isRegularGroup, isIntegrationGroup, isJWTGroup } =
    useGroupIdentification({
      id: group?.id,
      issued: group?.issued,
    });

  const isAllowedToRename = isRegularGroup && permission?.groups?.update;
  const isAllowedToDelete = !isIntegrationGroup && permission?.groups?.delete;

  const handleDelete = async () => {
    if (!isAllowedToDelete)
      return Promise.reject(
        t("contexts.main:groupProvider.text.notAllowedToDelete"),
      );

    const promise = groupRequest.del().then(() => {
      deleteGroupDropdownOption(group.name);
      if (isDetailPage) mutate(`/groups/${group.id}`);
      mutate("/groups");
    });

    notify({
      title: t("contexts.main:groupProvider.text.deleteGroup", {
        name: group.name,
      }),
      description: t(
        "contexts.main:groupProvider.description.groupSuccessfullyDeleted",
      ),
      promise,
      loadingMessage: t(
        "contexts.main:groupProvider.loadingMessage.deletingGroup",
      ),
    });

    return promise;
  };

  const deleteGroup = async () => {
    const choice = await confirm({
      title: t("contexts.main:groupProvider.title.delete", {
        name: group.name,
      }),
      description: t(
        "contexts.main:groupProvider.description.areYouSureYouWant",
      ),
      confirmText: t("common:word.delete"),
      cancelText: t("common:word.cancel"),
      type: "danger",
    });
    if (!choice) return;
    handleDelete().then();
  };

  const renameGroup = (name: string) => {
    if (!isAllowedToRename)
      return Promise.reject(
        t("contexts.main:groupProvider.text.notAllowedToRename"),
      );

    const currentPeerIds =
      group.peers?.map((p) => (typeof p === "string" ? p : p.id)) || [];
    const promise = groupRequest
      .put({ ...group, peers: currentPeerIds, name })
      .then(() => {
        updateGroupDropdown(group.name, { ...group, name });
        if (isDetailPage) mutate(`/groups/${group.id}`);
        mutate("/groups");
      });

    notify({
      title: t("contexts.main:groupProvider.title.renameGroup", {
        name: group.name,
      }),
      description: t(
        "contexts.main:groupProvider.text.groupSuccessfullyRenamedTo",
        { name },
      ),
      promise,
      loadingMessage: t(
        "contexts.main:groupProvider.loadingMessage.renamingGroup",
      ),
    });

    return promise;
  };

  const removePeersFromGroup = async (peers: Peer[]) => {
    if (!permission?.groups?.update) return Promise.reject();
    const peer = peers.length === 1 ? peers[0] : undefined;

    const choice = await confirm({
      title: peer
        ? t("contexts.main:groupProvider.text.removePeerFrom", {
            name: peer.name,
            name2: group.name,
          })
        : t("contexts.main:groupProvider.text.removePeersFrom", {
            name: group.name,
          }),
      description: peer
        ? t("contexts.main:groupProvider.text.areYouSureYouWant")
        : t("contexts.main:groupProvider.text.areYouSureYouWant2"),
      confirmText: t("contexts.main:groupProvider.confirmText.remove"),
      cancelText: t("common:word.cancel"),
      type: "warning",
      maxWidthClass: "max-w-lg",
    });

    if (!choice) return Promise.resolve();

    const currentPeerIds =
      group.peers?.map((p) => (typeof p === "string" ? p : p.id)) || [];
    const newPeerIds = currentPeerIds.filter((pid) => {
      return !peers.find((peer) => peer.id === pid);
    });
    const promise = groupRequest
      .put({ ...group, peers: newPeerIds })
      .then(() => {
        if (isDetailPage) mutate(`/groups/${group.id}`);
        mutate("/groups");
      });

    notify({
      title: t("contexts.main:groupProvider.title.removePeerFromGroup"),
      description: peer
        ? t(
            "contexts.main:groupProvider.text.peerSuccessfullyRemovedFromGroup",
            { name: peer.name, name2: group.name },
          )
        : t(
            "contexts.main:groupProvider.text.peersSuccessfullyRemovedFromGroup",
            { name: group.name },
          ),
      promise,
      loadingMessage: peer
        ? t("contexts.main:groupProvider.text.removingPeerFromGroup")
        : t("contexts.main:groupProvider.text.removingPeersFromGroup"),
    });

    return promise;
  };

  const addPeersToGroup = async (peers: Peer[]) => {
    if (!permission?.groups?.update) return Promise.reject();

    const currentPeerIds =
      group.peers?.map((p) => (typeof p === "string" ? p : p.id)) || [];
    const newPeerIds = [...currentPeerIds, ...peers.map((peer) => peer.id)];

    const uniquePeerIds = Array.from(new Set(newPeerIds));

    const promise = groupRequest
      .put({ ...group, peers: uniquePeerIds })
      .then(() => {
        if (isDetailPage) mutate(`/groups/${group.id}`);
        mutate("/groups");
      });

    notify({
      title: t("contexts.main:groupProvider.title.addingPeersToGroup"),
      description: t(
        "contexts.main:groupProvider.description.peersWereSuccessfullyAddedTo",
        { name: group.name },
      ),
      promise,
      loadingMessage: t(
        "contexts.main:groupProvider.loadingMessage.addingPeersToGroup",
      ),
    });

    return promise;
  };

  const removeUserFromGroup = async (
    user: User,
    returnOnlyPromise?: boolean,
  ) => {
    if (!permission?.groups?.update) return Promise.reject();
    if (!permission?.users?.update) return Promise.reject();

    const currentGroupIds = user.auto_groups?.map((g) => g) || [];
    const newGroupIds = currentGroupIds.filter((gid) => gid !== group.id);
    const promise = userRequest
      .put({ ...user, auto_groups: newGroupIds }, `/${user.id}`)
      .then(() => {
        if (returnOnlyPromise) return;
        if (isDetailPage) mutate(`/groups/${group.id}`);
        mutate("/groups");
        mutate("/users?service_user=false");
      });

    if (!returnOnlyPromise) {
      notify({
        title: t("contexts.main:groupProvider.title.removeUserFromGroup", {
          name: group.name,
        }),
        description: t(
          "contexts.main:groupProvider.description.userWasSuccessfullyRemovedFrom",
          { name: user.name, name2: group.name },
        ),
        promise,
        loadingMessage: t(
          "contexts.main:groupProvider.loadingMessage.removingUserFromGroup",
        ),
      });
    }

    return promise;
  };

  const removeUsersFromGroup = async (users: User[]) => {
    if (!permission?.groups?.update) return Promise.reject();
    if (!permission?.users?.update) return Promise.reject();
    let promises = users.map((user) => removeUserFromGroup(user, true));

    const user = users.length === 1 ? users[0] : undefined;

    const choice = await confirm({
      title: user
        ? t("contexts.main:groupProvider.text.removeUserFrom", {
            value: user?.name ?? user?.id,
            name: group.name,
          })
        : t("contexts.main:groupProvider.text.removeUsersFrom", {
            name: group.name,
          }),
      description: user
        ? t("contexts.main:groupProvider.text.areYouSureYouWant3")
        : t("contexts.main:groupProvider.text.areYouSureYouWant4"),
      confirmText: t("contexts.main:groupProvider.confirmText.remove"),
      cancelText: t("common:word.cancel"),
      type: "warning",
      maxWidthClass: "max-w-lg",
    });
    if (!choice) return Promise.resolve();

    const promise = Promise.all(promises).then(() => {
      if (isDetailPage) mutate(`/groups/${group.id}`);
      mutate("/groups");
      mutate("/users?service_user=false");
    });
    notify({
      title: t("contexts.main:groupProvider.title.removeUsersFromGroup", {
        name: group.name,
      }),
      description: t(
        "contexts.main:groupProvider.description.usersWereSuccessfullyRemovedFrom",
        { name: group.name },
      ),
      promise,
      loadingMessage: t(
        "contexts.main:groupProvider.loadingMessage.removingUsersFromGroup",
      ),
    });
    return promise;
  };

  const addUserToGroup = async (user: User, returnOnlyPromise?: boolean) => {
    if (!permission?.groups?.update) return Promise.reject();
    if (!permission?.users?.update) return Promise.reject();
    const currentGroupIds = user.auto_groups?.map((g) => g) || [];
    const newGroupIds = Array.from(new Set([...currentGroupIds, group.id]));
    const promise = userRequest
      .put({ ...user, auto_groups: newGroupIds }, `/${user.id}`)
      .then(() => {
        if (returnOnlyPromise) return;
        if (isDetailPage) mutate(`/groups/${group.id}`);
        mutate("/groups");
        mutate("/users?service_user=false");
      });
    if (!returnOnlyPromise) {
      notify({
        title: t("contexts.main:groupProvider.title.addUserToGroup", {
          name: group.name,
        }),
        description: t(
          "contexts.main:groupProvider.description.userWasSuccessfullyAddedTo",
          { name: user.name, name2: group.name },
        ),
        promise,
        loadingMessage: t(
          "contexts.main:groupProvider.loadingMessage.addingUserToGroup",
        ),
      });
    }
    return promise;
  };

  const addUsersToGroup = async (users: User[]) => {
    let promises = users.map((user) => addUserToGroup(user, true));
    const promise = Promise.all(promises).then(() => {
      if (isDetailPage) mutate(`/groups/${group.id}`);
      mutate("/groups");
      mutate("/users?service_user=false");
    });
    notify({
      title: t("contexts.main:groupProvider.title.addUsersToGroup", {
        name: group.name,
      }),
      description: t(
        "contexts.main:groupProvider.description.usersWereSuccessfullyAddedTo",
        { name: group.name },
      ),
      promise,
      loadingMessage: t(
        "contexts.main:groupProvider.loadingMessage.addingUsersToGroup",
      ),
    });
    return promise;
  };

  const openGroupRenameModal = () => {
    if (!isAllowedToRename) return;
    setGroupNameModal(true);
  };

  return (
    <GroupContext.Provider
      value={{
        group,
        deleteGroup,
        renameGroup,
        isRegularGroup,
        isIntegrationGroup,
        isJWTGroup,
        isAllowedToDelete,
        isAllowedToRename,
        openGroupRenameModal,
        addPeersToGroup,
        removePeersFromGroup,
        addUsersToGroup,
        removeUsersFromGroup,
      }}
    >
      <EditGroupNameModal
        initialName={group.name}
        open={groupNameModal}
        onOpenChange={setGroupNameModal}
        onSuccess={(newName) =>
          renameGroup(newName).then(() => {
            setGroupNameModal(false);
          })
        }
      />
      {children}
    </GroupContext.Provider>
  );
};

export const useGroupContext = () => {
  const context = React.useContext(GroupContext);
  if (!context) {
    throw new Error("useGroup must be used within a GroupProvider");
  }
  return context;
};
