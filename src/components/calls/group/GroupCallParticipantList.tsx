import { GroupCallParticipant as TypeGroupCallParticipant } from '../../../lib/secret-sauce';
import React, { FC, memo, useEffect, useMemo, useState } from '../../../lib/teact/teact';
import { getDispatch, withGlobal } from '../../../lib/teact/teactn';

import useLang from '../../../hooks/useLang';
import { selectActiveGroupCall } from '../../../modules/selectors/calls';
import useInfiniteScroll from '../../../hooks/useInfiniteScroll';
import buildClassName from '../../../util/buildClassName';
import Avatar from '../../common/Avatar';
import AnimatedIcon from '../../common/AnimatedIcon';

import GroupCallParticipant from './GroupCallParticipant';
import InfiniteScroll from '../../ui/InfiniteScroll';

import './GroupCallParticipant.scss';

type OwnProps = {
  openParticipantMenu: (anchor: HTMLDivElement, participant: TypeGroupCallParticipant) => void;
};

type StateProps = {
  participantsCount: number;
  participants?: Record<string, TypeGroupCallParticipant>;
  canInvite?: boolean;
};

const GroupCallParticipantList: FC<OwnProps & StateProps> = ({
  participants,
  participantsCount,
  openParticipantMenu,
}) => {
  const {
    createGroupCallInviteLink,
    loadMoreGroupCallParticipants,
    toggleGroupCallMute,
  } = getDispatch();

  const [number, setNumber] = useState(0);
  const lang = useLang();

  const handleUnmuteAll = () => {
    for (const participantId in participants) {
      if (participants[participantId].isSelf) {
        continue;
      }
      toggleGroupCallMute({
        participantId,
        value: false,
      });
    }
  };

  const handleMuteAll = () => {
    for (const participantId in participants) {
      if (participants[participantId].isSelf) {
        continue;
      }
      toggleGroupCallMute({
        participantId,
        value: true,
      });
    }
  };

  const participantsIds = useMemo(() => {
    return Object.keys(participants || {});
  }, [participants]);

  const [viewportIds, getMore] = useInfiniteScroll(
    loadMoreGroupCallParticipants,
    participantsIds,
    participantsIds.length >= participantsCount,
  );

  useEffect(() => {
    let newNumber = 0;
    participantsIds.forEach(participantId => {
      const participant = participants![participantId];
      if (participant.isUser) {
        const pAbout = participant.about;
        const pNumber = parseInt(pAbout ? (pAbout.match(/\d+/g) || ['0'])[0] : '0');
        newNumber += pNumber;
      }
    });
    setNumber(newNumber);
  }, [participants, participantsIds]);

  return (
    <div className="participants">
      <div className="invite-btn" onClick={createGroupCallInviteLink}>
        <div className="icon">
          <i className="icon-add-user" />
        </div>
        <div className="text">{lang('VoipGroupInviteMember')}</div>
      </div>

      <div
        className={buildClassName(
          'GroupCallParticipant',
          true && 'can-self-unmute',
        )}
      >
        <Avatar size="medium" />
        <div className="info">
          <span className="name">Rehetra</span>
          <span className={buildClassName('about')}>{number}</span>
        </div>
        <div className="microphone" onClick={handleUnmuteAll}>
          <AnimatedIcon
            name="VoiceOutlined"
            playSegment={[43, 44]}
            size={28}
            color={[0x57, 0xBC, 0x6C]}
          />
        </div>
        <div className="microphone ml-0" onClick={handleMuteAll}>
          <AnimatedIcon
            name="VoiceOutlined"
            playSegment={[22, 23]}
            size={28}
            color={[0xFF, 0x70, 0x6F]}
          />
        </div>
      </div>

      <InfiniteScroll
        items={viewportIds}
        onLoadMore={getMore}
      >
        {viewportIds?.map(
          (participantId) => (
            participants![participantId] && (
              <GroupCallParticipant
                key={participantId}
                openParticipantMenu={openParticipantMenu}
                participant={participants![participantId]}
              />
            )
          ),
        )}
      </InfiniteScroll>

    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const { participantsCount, participants } = selectActiveGroupCall(global) || {};

    return {
      participants,
      participantsCount: participantsCount || 0,
    };
  },
)(GroupCallParticipantList));
