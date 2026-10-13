import Button from "@components/Button";
import { Table } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import { t } from "@/i18n";
interface Props<TData> {
  table: Table<TData>;
}
export default function DataTableMultiSelectActions<TData>({
  table,
}: Props<TData>) {
  return table.getFilteredSelectedRowModel().rows.length > 0 ? (
    <div>
      <Button variant={"danger-outline"}>
        <Trash2 size={16} />
        {t("common:word.revoke")}{" "}
        {table.getFilteredSelectedRowModel().rows.length}{" "}
        {t("components.table:dataTableMultiSelectActions.text.keyS")}
      </Button>
    </div>
  ) : null;
}
