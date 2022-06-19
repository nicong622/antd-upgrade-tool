import React, { useState, useEffect } from 'react';
import BasicTablePage from '@/components/BasicTablePage';
import { Form, Icon as LegacyIcon } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Input, Button, Divider, Modal, Popconfirm, message } from 'antd';
import { Link, history } from 'umi';

import { download } from '@/utils/utils';
import { deleteAct, getActList, updateRemark, genWxCode } from '@/services/wxappActivity';
import dayjs from 'dayjs';
import style from './style.less';

const wxappActPageUrl = '/pages/activity/cooperation/index?id=';

// eslint-disable-next-line react/prefer-stateless-function
class PageForm extends React.Component {
  handleFilter = (e) => {
    e.preventDefault();
    this.props.form.validateFields((errors, values) => {
      if (!errors) {
        this.props.onSubmit(values);
      } else {
        console.log('err', errors);
      }
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <Form layout='inline' onSubmit={this.handleFilter}>
        <Form.Item label='活动ID'>{getFieldDecorator('id')(<Input />)}</Form.Item>
        <Form.Item label='活动名称'>{getFieldDecorator('name')(<Input />)}</Form.Item>
        <Form.Item>
          <Button type='primary' htmlType='submit'>
            查询
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

const CreatedForm = Form.create()(PageForm);

// 修改备注的 modal
const RemarkModal = function (props) {
  const [value, setValue] = useState(props.remark);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(props.remark);
  }, [props.remark]);

  function onOk() {
    setLoading(true);
    updateRemark(props.activityId, value).then((res) => {
      if (res.code === 0) {
        props.onUpdateSuccessfully(value);
        props.closeModal();
        setLoading(false);
      }
    });
  }

  function onChange(e) {
    setValue(e.target.value);
  }

  return (
    <Modal
      visible={props.visible}
      onOk={onOk}
      onCancel={props.closeModal}
      title='修改备注'
      confirmLoading={loading}
    >
      <Input placeholder='请输入备注' value={value} onChange={onChange} />
    </Modal>
  );
};

export default function Cooperation() {
  const columns = [
    {
      title: '活动ID',
      dataIndex: 'id',
    },
    {
      title: '活动名称',
      dataIndex: 'name',
    },
    {
      title: '创建时间',
      dataIndex: 'addTime',
      render(time) {
        return dayjs.unix(time).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    {
      title: '浏览量',
      dataIndex: 'readNum',
    },
    {
      title: '按钮点击次数',
      dataIndex: 'buttonClickNum',
    },
    {
      title: '备注',
      dataIndex: 'remark',
    },
    {
      title: '操作',
      dataIndex: 'actions',
      render(val, row, index) {
        return (
          <div>
            <Button type='primary' size='small' onClick={() => handleEdit(row)}>
              编辑
            </Button>
            <Button type='primary' size='small' onClick={() => showModal(index)}>
              备注
            </Button>
            <Popconfirm title='确认删除？' onConfirm={() => deleteOne(row.id)}>
              <Button type='primary' size='small'>
                删除
              </Button>
            </Popconfirm>
            <Button
              className='copy-link'
              type='primary'
              size='small'
              data-clipboard-text={`${wxappActPageUrl}${row.id}`}
            >
              复制活动链接
            </Button>
            <Button type='primary' size='small' onClick={() => showWxcodeModal(row.id)}>
              生成小程序码
            </Button>
          </div>
        );
      },
    },
  ];
  const [filterOptions, setFilterOptions] = useState({
    activityId: '',
    activityName: '',
    offset: 0,
    limit: PAGE_SIZE,
  });
  const [list, setList] = useState([]);
  const [paging, setPaging] = useState({
    offset: 0,
    limit: PAGE_SIZE,
    total: 0,
    hasMore: true,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDataIndex, setModalDataIndex] = useState('');

  useEffect(() => {
    updateList();
  }, [filterOptions.activityId, filterOptions.activityName, filterOptions.offset]);

  function updateList() {
    getActList(filterOptions).then((res) => {
      setList(res.data);
      setPaging(res.paging);
    });
  }

  function deleteOne(activityId) {
    deleteAct(activityId).then((res) => {
      if (res.code === 0) {
        message.success('删除成功');
        updateList();
      }
    });
  }

  function handleEdit(initialValue) {
    history.push(`./edit?id=${initialValue.id}`);
  }

  function onSubmit(formValues) {
    setFilterOptions({
      activityId: formValues.id,
      activityName: formValues.name,
      offset: 0,
      limit: PAGE_SIZE,
    });
  }

  function showModal(index) {
    setModalVisible(true);
    setModalDataIndex(index);
  }

  function closeModal() {
    setModalVisible(false);
  }

  function showWxcodeModal(activityId) {
    genWxCode(activityId).then((res) => {
      if (res.code === 0) {
        Modal.confirm({
          content: (
            <div className={style.wxcodeWrapper}>
              <img src={res.data.imgUrl} alt='' />
            </div>
          ),
          cancelText: '关闭',
          okText: '下载小程序码',
          onOk() {
            download(res.data.imgUrl);
          },
          icon: <LegacyIcon type='none' />,
        });
      }
    });
  }

  function onUpdateSuccessfully(remark) {
    const oldList = list;
    oldList[modalDataIndex].remark = remark;

    setList(oldList);
  }

  function handlePageChange(page) {
    setFilterOptions({
      ...filterOptions,
      offset: (page - 1) * PAGE_SIZE,
    });
  }

  return (
    <BasicTablePage
      columns={columns}
      dataSource={list}
      rowKey={(row) => row.id}
      paging={paging}
      handlePageChange={handlePageChange}
    >
      <CreatedForm onSubmit={onSubmit} />

      <Divider />

      <Link to='./edit'>
        <Button type='primary' className='create-new'>
          新增
        </Button>
      </Link>

      <RemarkModal
        visible={modalVisible}
        remark={list[modalDataIndex]?.remark}
        activityId={list[modalDataIndex]?.id}
        closeModal={closeModal}
        onUpdateSuccessfully={onUpdateSuccessfully}
      />
    </BasicTablePage>
  );
}
