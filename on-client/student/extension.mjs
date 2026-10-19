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
    renderEvents({ status, mode, data, error }) {
      const root = document.createElement('div');

      const line = (message) => {
        const p = document.createElement('p');
        p.textContent = message;
        root.appendChild(p);
      };

      if (mode === 'demo') {
        line('예제 자료(demo)');
      } else if (mode === 'disconnected') {
        line('서버 연결 없음(disconnected)');
      }

      if (status === 'loading') {
        line('보안 기록을 불러오는 중입니다.');
      } else if (status === 'error') {
        const message = typeof error?.message === 'string' && error.message.trim()
          ? error.message
          : '오류 내용을 확인할 수 없습니다.';

        line(`기록을 불러오지 못했습니다: ${message}`);

        if (error?.code === 'CONTRACT_MISMATCH') {
          line('응답 계약 확인 불가(CONTRACT_MISMATCH)');
        }
      } else if (status === 'ok') {
        if (!Array.isArray(data)) {
          line('기록을 불러오지 못했습니다: 응답 형식 확인 불가');
        } else {
          const events = [...data].sort(
            (a, b) => Date.parse(b.at) - Date.parse(a.at)
          );

          if (events.length === 0) {
            line('표시할 기록이 없습니다');
          } else {
            const rows = [];
            let openDetail = null;
            let openButton = null;

            for (const event of events) {
              const row = document.createElement('div');
              row.setAttribute('data-student-event-id', event.id);

              const kindNames = {
                access: '접속 기록',
                xdr: 'XDR 경보'
              };

              const kindLabel = Object.hasOwn(kindNames, event.kind)
                ? `${kindNames[event.kind]} (${event.kind})`
                : '확인 불가';

              const appLabel = typeof event.appId === 'string' && event.appId.trim()
                ? event.appId
                : '앱 확인 불가';

              const p = document.createElement('p');
              p.textContent = `기록 ID: ${event.id} · 시각: ${event.at} · 종류: ${kindLabel} · 앱: ${appLabel} · 요약: ${event.summary}`;

              row.appendChild(p);

              const detailButton = document.createElement('button');
              detailButton.type = 'button';
              detailButton.textContent = `${event.id} 상세`;
              detailButton.setAttribute('aria-expanded', 'false');

              detailButton.addEventListener('click', () => {
                const wasOpen = openButton === detailButton;

                if (openDetail) {
                  openDetail.remove();
                  openButton.setAttribute('aria-expanded', 'false');
                  openDetail = null;
                  openButton = null;
                }

                if (wasOpen) return;

                const detail = document.createElement('div');
                detail.setAttribute('data-student-event-detail', event.id);

                const detailLine = (message) => {
                  const item = document.createElement('p');
                  item.textContent = message;
                  detail.appendChild(item);
                };

                const statusNames = {
                  access: {
                    allowed: '접근 허용',
                    denied: '접근 거부',
                    unknown: '확인 불가'
                  },
                  session: {
                    active: '활성',
                    expired: '만료',
                    revoked: '철회됨',
                    unknown: '확인 불가'
                  },
                  device: {
                    compliant: '보안 기준 충족',
                    noncompliant: '보안 기준 미충족',
                    unknown: '확인 불가'
                  }
                };

                const showStatus = (type, code) =>
                  Object.hasOwn(statusNames[type], code)
                    ? `${statusNames[type][code]}(${code})`
                    : '확인 불가(unknown)';

                detailLine(`사건 ID: ${event.id}`);
                detailLine(`업무 앱: ${appLabel}`);

                detailLine('근거(evidence)');

                if (!Array.isArray(event.evidence) || event.evidence.length === 0) {
                  detailLine('근거 없음');
                } else {
                  for (const item of event.evidence) {
                    detailLine(`${item.id} — ${item.text}`);
                  }
                }

                detailLine('규칙(rules)');

                if (!Array.isArray(event.rules) || event.rules.length === 0) {
                  detailLine('규칙 없음');
                } else {
                  for (const item of event.rules) {
                    detailLine(`${item.id} — ${item.text}`);
                  }
                }

                detailLine(`접속 상태: ${showStatus('access', event.state?.access)}`);
                detailLine(`세션 상태: ${showStatus('session', event.state?.session)}`);
                detailLine(`기기 상태: ${showStatus('device', event.state?.device)}`);

                row.appendChild(detail);
                detailButton.setAttribute('aria-expanded', 'true');

                openDetail = detail;
                openButton = detailButton;
              });

              row.appendChild(detailButton);
              rows.push({ event, row });
            }

            const controls = document.createElement('div');
            const count = document.createElement('p');
            const list = document.createElement('div');

            root.appendChild(controls);
            root.appendChild(count);
            root.appendChild(list);

            const createFilter = (labelText, values, describe) => {
              const label = document.createElement('label');
              const title = document.createElement('span');
              title.textContent = `${labelText}: `;

              const select = document.createElement('select');
              select.setAttribute('aria-label', labelText);

              const all = document.createElement('option');
              all.value = 'all';
              all.textContent = '전체';
              select.appendChild(all);

              const uniqueValues = [...new Set(
                values.filter(value =>
                  typeof value === 'string' && value.length > 0 && value !== 'all'
                )
              )];

              for (const value of uniqueValues) {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = describe(value);
                select.appendChild(option);
              }

              label.appendChild(title);
              label.appendChild(select);
              controls.appendChild(label);
              return select;
            };

            const kindFilter = createFilter(
              '기록 종류',
              events.map(event => event.kind),
              value => value === 'access'
                ? '접속 기록 (access)'
                : value === 'xdr' ? 'XDR 경보 (xdr)' : value
            );

            const appFilter = createFilter(
              '업무 앱',
              events.map(event => event.appId),
              value => value
            );

            const accessFilter = createFilter(
              '접속 상태',
              events.map(event => event.state?.access),
              value => ({
                allowed: '허용됨',
                denied: '거부됨',
                unknown: '확인 불가'
              })[value] + ` (${value})`
            );

            const renderFiltered = () => {
              const matches = rows.filter(({ event }) =>
                (kindFilter.value === 'all' || event.kind === kindFilter.value) &&
                (appFilter.value === 'all' || event.appId === appFilter.value) &&
                (accessFilter.value === 'all' ||
                  event.state?.access === accessFilter.value)
              );

              count.textContent =
                `표시 ${matches.length}건 / 조회 ${events.length}건 (최신순)`;

              list.replaceChildren(...matches.map(item => item.row));

              if (matches.length === 0) {
                const empty = document.createElement('p');
                empty.textContent = '선택한 필터에 해당하는 기록이 없습니다.';
                list.appendChild(empty);
              }
            };

            for (const select of [kindFilter, appFilter, accessFilter]) {
              select.addEventListener('change', () => {
                if (openDetail) {
                  openDetail.remove();
                  openButton.setAttribute('aria-expanded', 'false');
                  openDetail = null;
                  openButton = null;
                }
                renderFiltered();
              });
            }

            renderFiltered();
          }
        }
      } else {
        line('보안 기록 조회 전');
      }

      return root;
    },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
