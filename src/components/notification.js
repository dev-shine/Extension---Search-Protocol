import { notification } from 'antd'

export const notifyError = (desc, title = 'Error', options = {}) => {
  notification.error({
    message: title,
    description: desc,
    style: {
      backgroundColor: '#fef0ef',
      border: '1px solid #fcdbd9'
    },
    ...options
  })
}

export const notifySuccess = (desc, title = 'Success', options = {}) => {
  notification.success({
    message: title,
    description: desc,
    style: {
      backgroundColor: '#ebf8f2',
      border: '1px solid #cfefdf'
    },
    ...options
  })
}
