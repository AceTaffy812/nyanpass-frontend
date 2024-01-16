import { TablePaginationConfig } from "antd";
import { FilterValue, SorterResult } from "antd/es/table/interface";
import QueryString from "qs";
import { cleanupDefaultValue } from "../util/misc";

export class ReqSearchRules {
    gid = 0
    gid_in = 0
    gid_out = 0
    name = ""
    dest = ""
    listen_port = 0
}

export interface TableParams {
    pagination?: TablePaginationConfig;
    sorter?: SorterResult<any> | SorterResult<any>[]
    filters?: Record<string, FilterValue | null>;
}

export function pagination2Qs(pagination: any) {
    return QueryString.stringify({
        page: pagination.current,
        size: pagination.pageSize,
    })
}

export function tableParams2Qs(tp: TableParams) {
    // 排序是用 key 当作 数据库 column name
    // console.log(tp)
    //
    const st = tp.sorter as any
    let columnKey = undefined
    let desc = undefined
    if (st != null && st.column != null) { // 有排序
        columnKey = st.columnKey
        if (st.order == "descend") {
            desc = 1
        }
    }
    return QueryString.stringify({
        page: tp.pagination?.current,
        size: tp.pagination?.pageSize,
        order: columnKey,
        desc: desc,
        filter: JSON.stringify(cleanupDefaultValue(tp.filters)),
    })
}
