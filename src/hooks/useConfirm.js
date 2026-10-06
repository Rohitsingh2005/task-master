import { useContext } from 'react'

import { ConfirmContext } from '../context/ConfirmContext'

function useConfirm() {
  const confirm = useContext(ConfirmContext)

  if (!confirm) {
    throw new Error('useConfirm must be used inside ConfirmProvider')
  }

  return confirm
}

export default useConfirm
