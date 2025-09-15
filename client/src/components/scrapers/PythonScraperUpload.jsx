import React, { useState, useEffect } from 'react';
import { Upload, Button, Form, Input, Select, message } from 'antd';
import { Modal } from 'antd';
import { UploadOutlined, FileTextOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { uploadPythonScraper, getStores } from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

const PythonScraperUpload = ({ visible, onClose, onSuccess }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [stores, setStores] = useState([]);
    const [fileList, setFileList] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchStores();
        }
    }, [visible]);

    const fetchStores = async () => {
        try {
            const response = await getStores();
            if (response.success) {
                setStores(response.data);
            } else {
                message.error('Mağazalar yüklenirken hata oluştu');
            }
        } catch (error) {
            console.error('Error fetching stores:', error);
            message.error('Mağazalar yüklenirken hata oluştu');
        }
    };

    const handleUpload = async (values) => {
        if (fileList.length === 0) {
            message.error('Lütfen bir Python dosyası seçin');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('pythonFile', fileList[0]);
        formData.append('name', values.name);
        formData.append('store', values.storeId);
        formData.append('description', values.description || '');
        formData.append('purpose', values.purpose || '');

        try {
            const response = await uploadPythonScraper(formData);
            if (response.success) {
                message.success('Python scraper başarıyla yüklendi!');
                form.resetFields();
                setFileList([]);
                onSuccess && onSuccess(response.data);
                onClose();
            } else {
                message.error(response.message || 'Yükleme sırasında hata oluştu');
            }
        } catch (error) {
            console.error('Upload error:', error);
            message.error('Yükleme sırasında hata oluştu');
        } finally {
            setUploading(false);
        }
    };

    const uploadProps = {
        beforeUpload: (file) => {
            const isPython = file.name.endsWith('.py');
            if (!isPython) {
                message.error('Sadece .py uzantılı dosyalar yüklenebilir!');
                return false;
            }
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                message.error('Dosya boyutu 10MB\'dan küçük olmalıdır!');
                return false;
            }
            setFileList([file]);
            return false;
        },
        fileList,
        onRemove: () => {
            setFileList([]);
        },
    };

    const handleCancel = () => {
        form.resetFields();
        setFileList([]);
        onClose();
    };

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CloudUploadOutlined style={{ color: '#1890ff' }} />
                    <span>Python Scraper Yüklə</span>
                </div>
            }
            open={visible}
            onCancel={handleCancel}
            footer={null}
            width={600}
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleUpload}
                style={{ marginTop: '20px' }}
            >
                <Form.Item
                    name="name"
                    label="Scraper Adı"
                    rules={[
                        { required: true, message: 'Scraper adı gereklidir!' },
                        { min: 3, message: 'Scraper adı en az 3 karakter olmalıdır!' }
                    ]}
                >
                    <Input
                        placeholder="Scraper adını girin"
                        prefix={<FileTextOutlined />}
                    />
                </Form.Item>

                <Form.Item
                    name="storeId"
                    label="Mağaza"
                    rules={[{ required: true, message: 'Mağaza seçimi gereklidir!' }]}
                >
                    <Select
                        placeholder="Mağaza seçin"
                        loading={loading}
                        showSearch
                        optionFilterProp="children"
                    >
                        {stores.map(store => (
                            <Option key={store._id} value={store._id}>
                                {store.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Açıklama"
                >
                    <TextArea
                        rows={3}
                        placeholder="Scraper hakkında kısa açıklama (opsiyonel)"
                    />
                </Form.Item>

                <Form.Item
                    name="purpose"
                    label="Scraper Növü"
                    rules={[{ required: true, message: 'Scraper növü seçimi gereklidir!' }]}
                >
                    <Select
                        placeholder="Scraper növünü seçin"
                    >
                        <Option value="general">Ümumi Scraper (Bütün məhsullar)</Option>
                        <Option value="product_specific">Məhsul Spesifik Scraper (Yalnız məhsul detalları)</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Python Dosyası"
                    required
                >
                    <Upload {...uploadProps}>
                        <Button icon={<UploadOutlined />}>
                            Python Dosyası Seç (.py)
                        </Button>
                    </Upload>
                    {fileList.length > 0 && (
                        <div style={{ marginTop: '8px', color: '#52c41a' }}>
                            ✓ {fileList[0].name} seçildi
                        </div>
                    )}
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCancel}>
                            İptal
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={uploading}
                            disabled={fileList.length === 0}
                            icon={<CloudUploadOutlined />}
                        >
                            {uploading ? 'Yüklənir...' : 'Yüklə'}
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default PythonScraperUpload;