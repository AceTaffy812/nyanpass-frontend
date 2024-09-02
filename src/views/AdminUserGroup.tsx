import { Button, Card, Flex, Input, Modal, Tooltip, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { asyncFetchJson, promiseFetchJson } from '../util/fetch';
import { api } from '../api/api';
import { allFalseMap, findObjByIdId } from '../util/misc';
import { showCommonError } from '../util/commonError';
import { DeleteOutlined, EditOutlined, FileAddOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { MyModal } from '../util/MyModal';
import { clone } from 'lodash-es';
import { newPromiseRejectNow } from '../util/promise';
import { DragSortTable, ProColumns } from '@ant-design/pro-components';

export function AdminUserGroupsView() {
  const editingObj = useRef<any>(null)
  const editingError = useRef({
    configJSON: false,
  })

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(false);

  const updateData = () => {
    setLoading(true);
    asyncFetchJson(api.admin.usergroup_list(), (ret) => {
      setLoading(false);
      if (ret.data != null) {
        for (let i = 0; i < ret.data.length; i++) {
          ret.data[i].display_name = ret.data[i].name + " (#" + ret.data[i].id + ")"
          if (ret.data[i].show_order == null) ret.data[i].show_order = 0
        }
        setData(ret.data)
      }
    })
  }
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      updateData()
    }
  }, []);

  // 表格

  const columns: ProColumns[] = [
    { title: '排序', dataIndex: 'show_order', className: 'drag-visible', },
    { title: '用户组 ID', key: 'id', dataIndex: 'id', },
    { title: '名称', key: 'name', dataIndex: 'name', },
    { title: '用户数量', key: 'user_count', dataIndex: 'user_count' },
    {
      title: '操作', key: 'action', dataIndex: 'id', renderText: function (e: number) {
        return <Flex gap={8}>
          <Tooltip title="编辑"><Button icon={<EditOutlined />} onClick={() => editUserGroup(findObjByIdId(data, e))} /></Tooltip>
          <Tooltip title="删除"><Button icon={<DeleteOutlined />} onClick={() => deleteUserGroup(e)} /></Tooltip>
        </Flex>
      }
    },
  ];

  function editUserGroup(obj: any, isNew?: boolean) {
    obj = clone(obj)
    if (isNew) obj = {}
    editingObj.current = obj
    MyModal.confirm({
      icon: <p />,
      title: isNew ? "添加用户组" : "编辑用户组 " + obj.display_name,
      content: <Flex vertical>
        <Flex className='neko-settings-flex-line'>
          <Typography.Text strong>名称</Typography.Text>
          <Input
            defaultValue={obj.name}
            onChange={(e) => editingObj.current.name = e.target.value}
          ></Input>
        </Flex>
      </Flex>,
      onOk: () => {
        if (!allFalseMap(editingError.current)) return newPromiseRejectNow(null)
        return promiseFetchJson(isNew ? api.admin.usergroup_create(editingObj.current) : api.admin.usergroup_update(obj.id, editingObj.current), (ret) => {
          showCommonError(ret, ["", "编辑用户组更新失败"], updateData)
        })
      }
    })
  }

  function deleteUserGroup(e: number) {
    MyModal.confirm({
      icon: <p />,
      title: "删除用户组",
      content: <p>你确定要删除用户组{findObjByIdId(data, e).display_name} 吗？</p>,
      onOk: () => {
        return promiseFetchJson(api.admin.usergroup_delete([e]), (ret) => {
          showCommonError(ret, ["", "删除用户组失败"], updateData)
        })
      }
    })
  }

  const handleDragSortEnd = (
    beforeIndex: number,
    afterIndex: number,
    newData: any,
  ) => {
    setData(newData)
    setLoading(true)
    asyncFetchJson(api.common.reorder("/api/v1/admin/usergroup/reorder", newData), (ret) => {
      setLoading(false)
      showCommonError(ret, true)
    })
  };

  return (
    <Card title="用户组管理">
      <Flex vertical>
        <Flex>
          <Button icon={<FileAddOutlined />} onClick={() => editUserGroup(null, true)}>添加用户组</Button>
          <Button icon={<QuestionCircleOutlined />} onClick={() => Modal.info({
            width: 600,
            maskClosable: true,
            title: "用户组说明",
            content: <div>
              <p>0. 用户组的作用只是方便分组和备注。</p>
              <p>1. 用户组 #0 是最基本的用户组，代表该用户新注册，未购买套餐，不能使用转发。</p>
              <p>2. 删除、编辑用户组不会对用户产生实际影响。</p>
              <p>3. 用户可以看到自己所在分组的名称，如果分组未命名，则显示用户组 ID。</p>
            </div>
          })}>查看说明</Button>
        </Flex>
        <DragSortTable
          rowKey="id"
          pagination={false}
          search={false}
          options={false}
          loading={loading}
          columns={columns}
          dataSource={data}
          dragSortKey="show_order"
          onDragSortEnd={handleDragSortEnd}
        />
      </Flex>
    </Card>
  )
}
