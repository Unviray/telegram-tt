import { GroupCallParticipant as TypeGroupCallParticipant, THRESHOLD } from '../../../lib/secret-sauce';
import React, {
  FC, memo, useMemo, useRef,
} from '../../../lib/teact/teact';
import { getDispatch, withGlobal } from '../../../lib/teact/teactn';

import { ApiChat, ApiUser } from '../../../api/types';

import buildClassName from '../../../util/buildClassName';
import { selectChat, selectUser } from '../../../modules/selectors';
import { selectIsAdminInActiveGroupCall } from '../../../modules/selectors/calls';
import useLang from '../../../hooks/useLang';
import { GROUP_CALL_DEFAULT_VOLUME, GROUP_CALL_VOLUME_MULTIPLIER } from '../../../config';

import Avatar from '../../common/Avatar';
import OutlinedMicrophoneIcon from './OutlinedMicrophoneIcon';

import './GroupCallParticipant.scss';

type OwnProps = {
  participant: TypeGroupCallParticipant;
  openParticipantMenu: (anchor: HTMLDivElement, participant: TypeGroupCallParticipant) => void;
};

type StateProps = {
  user?: ApiUser;
  chat?: ApiChat;
  isAdmin: boolean;
};

const GroupCallParticipant: FC<OwnProps & StateProps> = ({
  openParticipantMenu,
  participant,
  user,
  chat,
  isAdmin,
}) => {
  // eslint-disable-next-line no-null/no-null
  const anchorRef = useRef<HTMLDivElement>(null);
  const lang = useLang();

  const {
    toggleGroupCallMute,
  } = getDispatch();

  const { isSelf, isMutedByMe, canSelfUnmute, isMuted } = participant;
  const shouldRaiseHand = !canSelfUnmute && isMuted;
  const isSpeaking = (participant.amplitude || 0) > THRESHOLD;
  const isRaiseHand = Boolean(participant.raiseHandRating);

  const handleOnClick = () => {
    if (isSelf) return;
    openParticipantMenu(anchorRef.current!, participant);
  };

  const handleMicClick = (event:any) => {
    event.stopPropagation();

    toggleGroupCallMute({
      participantId: participant?.id,
      value: isAdmin ? !shouldRaiseHand : !isMutedByMe,
    });
  };

  const [aboutText, aboutColor] = useMemo(() => {
    if (isSelf) {
      return [lang('ThisIsYou'), 'blue'];
    }
    if (isMutedByMe) {
      return [lang('VoipGroupMutedForMe'), 'red'];
    }
    return isRaiseHand
      ? [lang('WantsToSpeak'), 'blue']
      : (!isMuted && isSpeaking ? [
        participant.volume && participant.volume !== GROUP_CALL_DEFAULT_VOLUME
          ? lang('SpeakingWithVolume',
            (participant.volume / GROUP_CALL_VOLUME_MULTIPLIER).toString())
            .replace('%%', '%') : lang('Speaking'),
        'green',
      ]
        : (participant.about ? [participant.about, ''] : [lang('Listening'), 'blue']));
  }, [isSpeaking, participant.volume, lang, isSelf, isMutedByMe, isRaiseHand, isMuted, participant.about]);

  if (!user && !chat) {
    return undefined;
  }

  const name = user ? `${user.firstName || ''} ${user.lastName || ''}` : chat?.title;

  return (
    <div
      className={buildClassName(
        'GroupCallParticipant',
        participant.canSelfUnmute && 'can-self-unmute',
      )}
      onClick={handleOnClick}
      ref={anchorRef}
    >
      <Avatar user={user} chat={chat} size="medium" />
      <div className="info">
        <span className="name">{name}</span>
        <span className={buildClassName('about', aboutColor)}>{aboutText}</span>
      </div>
      <div className="microphone" onClick={handleMicClick}>
        <OutlinedMicrophoneIcon participant={participant} />
      </div>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global, { participant }): StateProps => {
    return {
      user: participant.isUser ? selectUser(global, participant.id) : undefined,
      chat: !participant.isUser ? selectChat(global, participant.id) : undefined,
      isAdmin: selectIsAdminInActiveGroupCall(global),
    };
  },
)(GroupCallParticipant));
