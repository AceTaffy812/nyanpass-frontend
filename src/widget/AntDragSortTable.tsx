import React, { useContext, useMemo } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Table } from 'antd';
import type { TableProps } from 'antd';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { HolderOutlined } from '@ant-design/icons';
import { myLodash } from '../myvar';

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    'data-row-key': string;
}

interface RowContextProps {
    setActivatorNodeRef?: (element: HTMLElement | null) => void;
    listeners?: SyntheticListenerMap;
}

const RowContext = React.createContext<RowContextProps>({});

export const DragHandle: React.FC = () => {
    const { setActivatorNodeRef, listeners } = useContext(RowContext);
    return (
        <Button
            type="text"
            size="small"
            icon={<HolderOutlined />}
            style={{ cursor: 'move' }}
            ref={setActivatorNodeRef}
            {...listeners}
        />
    );
};

const Row: React.FC<RowProps> = (props) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props['data-row-key'] });

    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Translate.toString(transform),
        transition,
        ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
    };

    const contextValue = useMemo<RowContextProps>(
        () => ({ setActivatorNodeRef, listeners }),
        [setActivatorNodeRef, listeners],
    );

    return (
        <RowContext.Provider value={contextValue}>
            <tr {...props} ref={setNodeRef} style={style} {...attributes} />
        </RowContext.Provider>
    );
};

function getItemId(i: any, rowKey?: any): string {
    if (rowKey == null) {
        return i.key
    }
    return i[rowKey]
}

type AntDragSortTableProps<T> = {
    dataSource: T[];
    dragSortKey: keyof T | false;
    onDragSortEnd?: (
        beforeIndex: number,
        afterIndex: number,
        newData: T[]
    ) => void;
} & TableProps<T>;

export function AntDragSortTable<T extends { key: React.Key }>(
    props: AntDragSortTableProps<T>
) {
    const {
        dataSource,
        columns,
        ...restProps // 其余 Table 参数
    } = props;

    const sortedData = props.dragSortKey === false ? dataSource : useMemo(() => {
        return dataSource.sort((a, b) => {
            const va = a[props.dragSortKey as (keyof T)] as number;
            const vb = b[props.dragSortKey as (keyof T)] as number;
            return va - vb;
        });
    }, [dataSource, props.dragSortKey]);

    const onDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;

        // 2. 找到拖动前后索引（基于当前 UI 顺序）
        const oldIndex = sortedData.findIndex((i) => getItemId(i, props.rowKey) === active.id);
        const newIndex = sortedData.findIndex((i) => getItemId(i, props.rowKey) === over.id);

        // 3. 调整顺序
        let reordered = arrayMove(sortedData, oldIndex, newIndex);

        // 4. 更新 sortKey（如 show_order），确保写回修改后的顺序值
        if (props.dragSortKey !== false) {
            reordered = reordered.map((item, index) => ({
                ...item,
                [props.dragSortKey as (keyof T)]: index,
            }));
        }
        //  else {
        //     reordered = myLodash.map(reordered, (item) => myLodash.omit(item, '__id_key')) as any
        // }

        // ✅ 5. 调用回调，只执行一次，且传入的是已更新的 data
        props.onDragSortEnd?.(oldIndex, newIndex, reordered);
    };

    return (
        <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
            <SortableContext
                items={sortedData.map((i) => getItemId(i, props.rowKey))}
                strategy={verticalListSortingStrategy}
            >
                <Table
                    components={{ body: { row: Row } }}
                    columns={columns}
                    dataSource={sortedData}
                    {...restProps}
                />
            </SortableContext>
        </DndContext>
    );
}

// 根据当前顺序添加 rowKey
export function addRowKeyToList(dataSource: any[], rowKey: string) {
    return myLodash.map(myLodash.cloneDeep(dataSource), (item, index) => {
        (item as any)[rowKey] = index + 1;
        return item;
    });
}
