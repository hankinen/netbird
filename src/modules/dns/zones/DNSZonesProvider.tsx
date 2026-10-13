import { notify } from "@components/Notification";
import { useApiCall } from "@utils/api";
import * as React from "react";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { useDialog } from "@/contexts/DialogProvider";
import { t } from "@/i18n";
import { DNSRecord, DNSZone } from "@/interfaces/DNS";
import { Group } from "@/interfaces/Group";
import DNSRecordModal from "@/modules/dns/zones/DNSRecordModal";
import DNSZoneModal from "@/modules/dns/zones/DNSZoneModal";
type Props = {
  children?: React.ReactNode;
};

const DNSZonesContext = React.createContext(
  {} as {
    createZone: (zone: DNSZone) => Promise<DNSZone>;
    updateZone: (zone: DNSZone) => Promise<DNSZone>;
    deleteZone: (zone: DNSZone) => Promise<DNSZone>;
    openZoneModal: (
      zone?: DNSZone,
      initialDistributionGroups?: Group[],
    ) => void;
    openRecordModal: (zone: DNSZone, record?: DNSRecord) => void;
    addRecord: (zone: DNSZone, record: DNSRecord) => Promise<DNSRecord>;
    updateRecord: (zone: DNSZone, record: DNSRecord) => Promise<DNSRecord>;
    deleteRecord: (zone: DNSZone, record: DNSRecord) => Promise<DNSRecord>;
    askForRecord: (zone: DNSZone) => void;
  },
);

export const DNSZonesProvider = ({ children }: Props) => {
  const { mutate } = useSWRConfig();
  const zoneRequest = useApiCall<DNSZone>("/dns/zones", true);
  const recordRequest = useApiCall<DNSRecord>("/dns/zones", true);
  const [dnsModal, setDnsModal] = useState(false);
  const [recordModal, setRecordModal] = useState(false);
  const [currentZone, setCurrentZone] = useState<DNSZone>();
  const [currentRecord, setCurrentRecord] = useState<DNSRecord>();
  const [initialDistributionGroups, setInitialDistributionGroups] =
    useState<Group[]>();
  const { confirm } = useDialog();

  const createZone = async (zone: DNSZone): Promise<DNSZone> => {
    const promise = zoneRequest.post(zone).then((zone) => {
      mutate("/dns/zones");
      return Promise.resolve(zone);
    });

    notify({
      title: t("dns.zones:dNSZonesProvider.title.dNSZone", {
        domain: zone.domain,
      }),
      description: t(
        "dns.zones:dNSZonesProvider.description.dNSZoneWasAddedSuccessfully",
      ),
      promise: promise,
      loadingMessage: t(
        "dns.zones:dNSZonesProvider.loadingMessage.addingDNSZone",
      ),
    });

    return promise;
  };

  const updateZone = async (zone: DNSZone): Promise<DNSZone> => {
    if (!zone?.id)
      return Promise.reject(
        t("dns.zones:dNSZonesProvider.text.canNotUpdateDNSZone"),
      );
    const promise = zoneRequest.put(zone, `/${zone.id}`).then((zone) => {
      mutate("/dns/zones");
      return Promise.resolve(zone);
    });

    notify({
      title: t("dns.zones:dNSZonesProvider.title.dNSZone", {
        domain: zone.domain,
      }),
      description: t(
        "dns.zones:dNSZonesProvider.description.dNSZoneWasUpdatedSuccessfully",
      ),
      promise: promise,
      loadingMessage: t(
        "dns.zones:dNSZonesProvider.loadingMessage.updatingDNSZone",
      ),
    });

    return promise;
  };

  const deleteZone = async (zone: DNSZone): Promise<DNSZone> => {
    if (!zone?.id)
      return Promise.reject(
        t("dns.zones:dNSZonesProvider.text.canNotDeleteDNSZone"),
      );

    const choice = await confirm({
      title: t("dns.zones:dNSZonesProvider.title.deleteZone", {
        domain: zone.domain,
      }),
      description: t(
        "dns.zones:dNSZonesProvider.description.areYouSureYouWant",
      ),
      confirmText: t("common:word.delete"),
      cancelText: t("common:word.cancel"),
      type: "danger",
      maxWidthClass: "max-w-md",
    });
    if (!choice) return Promise.resolve(zone);

    const promise = zoneRequest.del({}, `/${zone.id}`).then((zone) => {
      mutate("/dns/zones");
      return Promise.resolve(zone);
    });

    notify({
      title: t("dns.zones:dNSZonesProvider.title.dNSZone", {
        domain: zone.domain,
      }),
      description: t(
        "dns.zones:dNSZonesProvider.description.dNSZoneWasDeletedSuccessfully",
      ),
      promise: promise,
      loadingMessage: t(
        "dns.zones:dNSZonesProvider.loadingMessage.deletingDNSZone",
      ),
    });

    return promise;
  };

  const addRecord = async (
    zone: DNSZone,
    record: DNSRecord,
  ): Promise<DNSRecord> => {
    if (!zone?.id)
      return Promise.reject(
        t("dns.zones:dNSZonesProvider.text.canNotAddDNSRecord"),
      );
    const promise = recordRequest
      .post(record, `/${zone.id}/records`)
      .then((record) => {
        mutate("/dns/zones");
        return Promise.resolve(record);
      });

    notify({
      title: t("dns.zones:dNSZonesProvider.title.record", {
        type: record.type,
        name: record.name,
      }),
      description: t(
        "dns.zones:dNSZonesProvider.description.dNSRecordWasAddedSuccessfully",
      ),
      promise: promise,
      loadingMessage: t(
        "dns.zones:dNSZonesProvider.loadingMessage.addingDNSRecord",
      ),
    });

    return promise;
  };

  const updateRecord = async (
    zone: DNSZone,
    record: DNSRecord,
  ): Promise<DNSRecord> => {
    if (!zone?.id)
      return Promise.reject(
        t("dns.zones:dNSZonesProvider.text.canNotUpdateDNSRecord"),
      );
    if (!record?.id)
      return Promise.reject(
        t("dns.zones:dNSZonesProvider.text.canNotUpdateDNSRecord2"),
      );
    const promise = recordRequest
      .put(record, `/${zone.id}/records/${record.id}`)
      .then((record) => {
        mutate("/dns/zones");
        return Promise.resolve(record);
      });

    notify({
      title: t("dns.zones:dNSZonesProvider.title.record", {
        type: record.type,
        name: record.name,
      }),
      description: t(
        "dns.zones:dNSZonesProvider.description.dNSRecordWasUpdatedSuccessfully",
      ),
      promise: promise,
      loadingMessage: t(
        "dns.zones:dNSZonesProvider.loadingMessage.updatingDNSRecord",
      ),
    });

    return promise;
  };

  const deleteRecord = async (
    zone: DNSZone,
    record: DNSRecord,
  ): Promise<DNSRecord> => {
    if (!zone?.id)
      return Promise.reject(
        t("dns.zones:dNSZonesProvider.text.canNotDeleteDNSRecord"),
      );
    if (!record?.id)
      return Promise.reject(
        t("dns.zones:dNSZonesProvider.text.canNotDeleteDNSRecord2"),
      );

    const choice = await confirm({
      title: t("dns.zones:dNSZonesProvider.title.deleteRecord", {
        name: record.name,
      }),
      description: t(
        "dns.zones:dNSZonesProvider.description.areYouSureYouWant2",
      ),
      confirmText: t("common:word.delete"),
      cancelText: t("common:word.cancel"),
      type: "danger",
      maxWidthClass: "max-w-md",
    });
    if (!choice) return Promise.resolve(record);

    const promise = recordRequest
      .del({}, `/${zone.id}/records/${record.id}`)
      .then((record) => {
        mutate("/dns/zones");
        return Promise.resolve(record);
      });

    notify({
      title: t("dns.zones:dNSZonesProvider.title.record", {
        type: record.type,
        name: record.name,
      }),
      description: t(
        "dns.zones:dNSZonesProvider.description.dNSRecordWasDeletedSuccessfully",
      ),
      promise: promise,
      loadingMessage: t(
        "dns.zones:dNSZonesProvider.loadingMessage.deletingDNSRecord",
      ),
    });

    return promise;
  };

  const openZoneModal = (zone?: DNSZone, distributionGroups?: Group[]) => {
    if (zone) setCurrentZone(zone);
    if (distributionGroups) setInitialDistributionGroups(distributionGroups);
    setDnsModal(true);
  };

  const openRecordModal = (zone: DNSZone, record?: DNSRecord) => {
    setCurrentZone(zone);
    if (record) setCurrentRecord(record);
    setRecordModal(true);
  };

  const askForRecord = async (zone: DNSZone) => {
    const choice = await confirm({
      title: t("dns.zones:dNSZonesProvider.title.addNewRecordTo", {
        name: zone.name,
      }),
      description: t("dns.zones:dNSZonesProvider.description.addEitherAnAAAAA"),
      confirmText: t("dns.zones:dNSRecordModal.text.addRecord"),
      cancelText: t("common:word.later"),
      type: "default",
      maxWidthClass: "max-w-md",
    });
    if (!choice) return;
    openRecordModal(zone);
  };

  return (
    <DNSZonesContext.Provider
      value={{
        createZone,
        updateZone,
        deleteZone,
        openZoneModal,
        openRecordModal,
        addRecord,
        updateRecord,
        deleteRecord,
        askForRecord,
      }}
    >
      {children}
      <DNSZoneModal
        open={dnsModal}
        onOpenChange={(open) => {
          setDnsModal(open);
          if (!open) {
            setCurrentZone(undefined);
            setInitialDistributionGroups(undefined);
          }
        }}
        onSuccessAdded={(z) => askForRecord(z)}
        zone={currentZone}
        initialDistributionGroups={initialDistributionGroups}
      />
      {currentZone && (
        <DNSRecordModal
          open={recordModal}
          onOpenChange={(open) => {
            setRecordModal(open);
            if (!open) {
              setCurrentZone(undefined);
              setCurrentRecord(undefined);
            }
          }}
          zone={currentZone}
          record={currentRecord}
        />
      )}
    </DNSZonesContext.Provider>
  );
};

export const useDNSZones = () => React.useContext(DNSZonesContext);
