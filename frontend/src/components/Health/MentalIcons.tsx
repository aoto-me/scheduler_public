import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';

export const MentalIcons: Record<
  string,
  {
    icon: React.ReactElement;
    label: string;
  }
> = {
  1: {
    icon: (
      <SentimentVeryDissatisfiedIcon
        sx={{
          color: '#bb8383',
          fontSize: 'inherit',
        }}
      />
    ),
    label: '調子1',
  },
  2: {
    icon: (
      <SentimentDissatisfiedIcon
        sx={{
          color: '#c79978',
          fontSize: 'inherit',
        }}
      />
    ),
    label: '調子2',
  },
  3: {
    icon: (
      <SentimentSatisfiedIcon
        sx={{
          color: '#d1bc6f',
          fontSize: 'inherit',
        }}
      />
    ),
    label: '調子3',
  },
  4: {
    icon: (
      <SentimentSatisfiedAltIcon
        sx={{
          color: '#7bafa7',
          fontSize: 'inherit',
        }}
      />
    ),
    label: '調子4',
  },
  5: {
    icon: (
      <SentimentVerySatisfiedIcon
        sx={{
          color: '#6e91af',
          fontSize: 'inherit',
        }}
      />
    ),
    label: '調子5',
  },
};
