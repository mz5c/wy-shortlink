import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker } from 'antd';
import dayjs from 'dayjs';

interface LinkFormModalProps {
  open: boolean;
  editingLink?: { shortCode?: string; originalUrl?: string; expireTime?: string | null };
  onOk: (values: any) => void;
  onCancel: () => void;
}

const LinkFormModal: React.FC<LinkFormModalProps> = ({ open, editingLink, onOk, onCancel }) => {
  const [form] = Form.useForm();
  const isEdit = !!editingLink?.shortCode;

  useEffect(() => {
    if (open) {
      if (isEdit) {
        form.setFieldsValue({ url: editingLink.originalUrl, expireTime: editingLink.expireTime ? dayjs(editingLink.expireTime) : null });
      } else { form.resetFields(); }
    }
  }, [open, isEdit, editingLink, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const params: { url: string; alias?: string; expireTime?: string } = { url: values.url };
      if (values.alias) params.alias = values.alias;
      if (values.expireTime) params.expireTime = values.expireTime.format('YYYY-MM-DDTHH:mm:ss');
      onOk(params);
    } catch {
      // validation failed, antd shows inline error messages
    }
  };

  return (
    <Modal title={isEdit ? '编辑短链' : '创建短链'} open={open} onOk={handleOk} onCancel={onCancel} destroyOnClose>
      <Form form={form} layout="vertical">
        <Form.Item name="url" label="原始 URL" rules={[{ required: true, message: '请输入 URL' }, { type: 'url', message: '请输入有效的 URL' }]}>
          <Input placeholder="https://example.com/long-url" />
        </Form.Item>
        {!isEdit && (
          <Form.Item name="alias" label="自定义别名" rules={[{ pattern: /^[a-zA-Z0-9]{6,20}$/, message: '6-20位字母数字' }]}>
            <Input placeholder="可选，6-20位字母数字" maxLength={20} />
          </Form.Item>
        )}
        <Form.Item name="expireTime" label="过期时间">
          <DatePicker showTime style={{ width: '100%' }} placeholder="可选，不选则永久有效" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default LinkFormModal;
