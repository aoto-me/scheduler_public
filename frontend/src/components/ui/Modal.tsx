import { ICONS } from '@/configs';
import { Backdrop, Box, Fade, IconButton, Modal as MuiModal, Paper } from '@mui/material';
import { memo, type ReactNode, useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  children: ReactNode;
  isLoading?: boolean;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  width?: string;
}

export const Modal = memo(({ children, isLoading = false, isOpen, setIsOpen, width = '600px' }: ModalProps) => {
  const handleModalClose = (_event: React.SyntheticEvent<unknown>, _reason: string) => {
    if (isLoading) return;
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const iconButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // 開いたときにIconButtonにフォーカスを移す
    if (isOpen && iconButtonRef.current) {
      iconButtonRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      <MuiModal
        aria-describedby="modal-description"
        closeAfterTransition // モーダルが閉じた後にフォーカスを元に戻さない
        disableRestoreFocus={true}
        onClose={handleModalClose}
        open={isOpen}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
        slots={{ backdrop: Backdrop }}
      >
        <Fade in={isOpen} timeout={250}>
          <Paper
            aria-modal="true"
            elevation={24}
            role="dialog"
            sx={{
              left: '50%',
              maxHeight: `max(85vh, 90svh)`,
              maxWidth: '95vw',
              outline: 'none',
              overflowY: 'auto',
              p: 3,
              position: 'absolute',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width,
            }}
            variant="elevation"
          >
            <IconButton
              aria-label="閉じる"
              onClick={handleClose}
              ref={iconButtonRef}
              sx={{
                m: 1,
                position: 'absolute',
                right: -2,
                top: -2,
                zIndex: 1,
              }}
            >
              <Icon icon={ICONS.close} size="0.875rem" />
            </IconButton>
            <Box id="modal-description" sx={{ mt: 2 }}>
              {children}
            </Box>
          </Paper>
        </Fade>
      </MuiModal>
      <Backdrop
        open={isLoading}
        sx={{
          backgroundColor: 'transparent',
          zIndex: 9999,
        }}
      />
    </>
  );
});
