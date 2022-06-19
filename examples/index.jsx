import React from 'react';
import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.css';
import { Button, Modal, Input, Radio, Row, Col, message } from 'antd';
import { connect } from 'umi';

@connect(({ batchManage }) => ({
  batchManage,
}))
class NotifySettingModal extends React.Component {
  state = {
    notifyList: [0],
    disabled: false,
    defaultUser: null,
  };

  keyIndex = 1;

  componentDidUpdate(prevProps, prevState) {
    if (this.props.batchData.notifyUser && !prevState.defaultUser) {
      const notifyUser = JSON.parse(this.props.batchData.notifyUser);
      const notifyList = [];

      this.keyIndex = notifyUser.length;

      notifyUser.forEach((v, index) => notifyList.push(index));

      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        notifyList,
        defaultUser: notifyUser,
      });
    }
  }

  addRow = () => {
    this.setState((prevState) => ({
      notifyList: prevState.notifyList.concat(this.keyIndex++),
    }));
  };

  removeRow = (key) => {
    this.setState((prevState) => ({
      notifyList: prevState.notifyList.filter((idx) => idx !== key),
    }));
  };

  getNamePhone = (data) =>
    Object.entries(data)
      .filter(([key]) => key.includes('-'))
      .reduce((acc, [key, val]) => {
        const [type, idx] = key.split('-');
        acc[idx] = { ...acc[idx], [type]: val };
        return acc;
      }, [])
      .filter(Boolean);

  onSwitchNotify = (e) => {
    const { value } = e.target;
    this.setState({ disabled: value === 1 });
  };

  handleConfirm = () => {
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.props
          .dispatch({
            type: 'batchManage/modifyConsumeNotify',
            payload: {
              notify: values.notify,
              batchId: this.props.batchData.id,
              notifyUser: JSON.stringify(this.getNamePhone(values)),
            },
          })
          .then((res) => {
            if (res && res.code === 0) {
              message.success('设置成功');
              this.handleCloseModal();
            }
          })
          .catch();
      }
    });
  };

  handleCloseModal = () => {
    this.props.onCancel();
    this.props.form.resetFields();
    this.setState({
      notifyList: [0],
      defaultUser: null,
    });
    this.keyIndex = 1;
  };

  render() {
    const { visible, form, batchData = {} } = this.props;
    const { getFieldDecorator } = form;
    let { notifyUser } = batchData;

    if (notifyUser) {
      notifyUser = JSON.parse(notifyUser);
    }

    return (
      <Modal
        visible={visible}
        onCancel={this.handleCloseModal}
        onOk={this.handleConfirm}
        title='短信提醒设置'
      >
        <Form layout='inline'>
          <Form.Item label='开关'>
            {getFieldDecorator('notify', {
              initialValue: batchData.openNotify || 2,
            })(
              <Radio.Group onChange={this.onSwitchNotify}>
                <Radio value={2}>打开</Radio>
                <Radio value={1}>关闭</Radio>
              </Radio.Group>
            )}
          </Form.Item>

          {this.state.notifyList.map((key) => (
            <Row key={key} gutter={8}>
              <Col span={9}>
                <Form.Item label='姓名' labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                  {getFieldDecorator(`name-${key}`, {
                    initialValue: notifyUser && notifyUser[key] ? notifyUser[key].name : '',
                    rules: [{ required: true, message: '请输入姓名' }],
                  })(<Input disabled={this.state.disabled} />)}
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label='手机号' labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
                  {getFieldDecorator(`phone-${key}`, {
                    initialValue: notifyUser && notifyUser[key] ? notifyUser[key].phone : '',
                    rules: [{ required: true, message: '请输入手机号' }],
                  })(<Input disabled={this.state.disabled} />)}
                </Form.Item>
              </Col>
              <Col span={3}>
                <Form.Item>
                  <Button type='danger' onClick={() => this.removeRow(key)}>
                    删除
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          ))}

          <Row style={{ marginTop: '20px' }}>
            <Col offset={10}>
              <Button type='primary' onClick={this.addRow}>
                增加
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>
    );
  }
}

export default NotifySettingModal;
