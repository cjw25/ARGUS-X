// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  return {
    renderIdentity({ me, devices, sessions }) {
      const root = document.createElement('div');

      const deviceNames = {
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족',
        unknown: '확인 불가'
      };

      const sessionNames = {
        active: '활성',
        expired: '만료',
        revoked: '철회됨',
        unknown: '확인 불가'
      };

      const modeNames = {
        demo: '예제 자료',
        disconnected: '연결 없음',
        unknown: '확인 불가'
      };

      const value = (item) =>
        typeof item === 'string' && item.trim() ? item.trim() : '확인 불가';

      const translated = (names, status) =>
        Object.hasOwn(names, status) ? `${names[status]} (${status})` : '확인 불가';

      const line = (parent, text) => {
        const p = document.createElement('p');
        p.textContent = text;
        parent.appendChild(p);
      };

      const section = (title, resource, showData) => {
        const part = document.createElement('section');
        const heading = document.createElement('h4');
        heading.textContent = title;
        part.appendChild(heading);

        if (Object.hasOwn(modeNames, resource?.mode)) {
          line(part, modeNames[resource.mode]);
        }

        if (resource?.status === 'loading') {
          line(part, '불러오는 중');
        } else if (resource?.status === 'error') {
          const message = value(resource.error?.message);
          const unverifiable = ['CONTRACT_MISMATCH', 'ENGINE_RESULT_UNVERIFIED'].includes(resource.error?.code);
          line(part, `${unverifiable ? '확인 불가' : '연결 실패'}: ${message}`);
        } else if (resource?.status === 'ok') {
          showData(part, resource.data);
        } else {
          line(part, '확인 불가');
        }

        root.appendChild(part);
      };

      section('현재 계정·기기·세션', me, (part, data) => {
        line(part, `사용자: ${value(data?.user?.label)} (ID: ${value(data?.user?.id)})`);
        line(part, `현재 기기: ${value(data?.device?.label)} (ID: ${value(data?.device?.id)}) · ${translated(deviceNames, data?.device?.status)}`);
        line(part, `로그인 세션: ${value(data?.session?.id)} · ${translated(sessionNames, data?.session?.status)}`);
      });

      section('기기 목록', devices, (part, data) => {
        if (!Array.isArray(data) || data.length === 0) {
          line(part, '표시할 기기가 없습니다.');
          return;
        }

        for (const device of data) {
          line(part, `${value(device?.label)} (ID: ${value(device?.id)}) · ${translated(deviceNames, device?.status)}`);
        }
      });

      section('세션 목록', sessions, (part, data) => {
        if (!Array.isArray(data) || data.length === 0) {
          line(part, '표시할 세션이 없습니다.');
          return;
        }

        for (const session of data) {
          line(part, `${value(session?.id)} · ${translated(sessionNames, session?.status)}`);
        }
      });

      return root;
    },
    renderDecision({ status, mode, data, error, appId }) {
      const root = document.createElement('div');

      const line = (message) => {
        const p = document.createElement('p');
        p.textContent = message;
        root.appendChild(p);
      };

      const safeText = (value) =>
        typeof value === 'string' && value.trim() ? value.trim() : '확인 불가';

      if (status === 'idle') {
        line('업무 앱을 선택하고 접속을 요청하세요.');
      } else if (status === 'loading') {
        line(`업무 앱: ${safeText(appId)}`);
        line('판정 확인 중');
      } else if (status === 'error') {
        line(`업무 앱: ${safeText(appId)}`);
        line(`요청 실패: ${safeText(error?.message)}`);
        line('요청 실패는 접근 거부 판정이 아닙니다.');
      } else if (status === 'ok') {
        const decisionNames = {
          allow: '접근 허용',
          deny: '접근 거부',
          challenge: '추가 인증 또는 확인 필요',
          unknown: '판정 확인 불가'
        };

        const code = Object.hasOwn(decisionNames, data?.decision)
          ? data.decision
          : 'unknown';

        line(`업무 앱: ${safeText(data?.appId ?? appId)}`);
        line(`접근 판정: ${decisionNames[code]} (${code})`);
        line(`판정 이유: ${safeText(data?.reason)}`);
        line(`판정 시각: ${safeText(data?.checkedAt)}`);

        if (code === 'allow') {
          line('정책상 접근 허용이며 실제 앱 접속 성공을 보장하지 않습니다.');
        } else if (code === 'challenge') {
          line('추가 인증 또는 확인은 이 화면에서 수행되지 않습니다.');
        } else if (code === 'unknown') {
          line('접근 허용 여부를 확인할 수 없습니다.');
        }
      } else {
        line('판정 상태 확인 불가');
      }

      return root;
    },
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
