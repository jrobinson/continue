import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { debounce } from "lodash";
import { useContext, useEffect, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { v4 as uuidv4 } from "uuid";
import { defaultBorderRadius, lightGray, vscEditorBackground } from "../..";
import { IdeMessengerContext } from "../../../context/IdeMessenger";
import { useWebviewListener } from "../../../hooks/useWebviewListener";
import { getFontSize } from "../../../util";
import { childrenToText } from "../utils";
import ApplyActions from "./ApplyActions";
import CopyButton from "./CopyButton";
import FileInfo from "./FileInfo";
import GeneratingCodeLoader from "./GeneratingCodeLoader";
import { useAppSelector } from "../../../redux/hooks";
import { selectDefaultModel } from "../../../redux/slices/configSlice";
import { selectApplyStateBySessionId } from "../../../redux/slices/sessionSlice";

const fadeInAnimation = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const TopDiv = styled.div<{ active?: boolean }>`
  outline: 1px solid rgba(153, 153, 152);
  outline-offset: -0.5px;
  border-radius: ${defaultBorderRadius};
  margin-bottom: 8px !important;
  background-color: ${vscEditorBackground};
  min-width: 0;
  ${(props) =>
    props.active
      ? "animation: none;"
      : css`
          animation: ${fadeInAnimation} 300ms ease-out forwards;
        `}
`;

const ToolbarDiv = styled.div<{ isExpanded: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: inherit;
  font-size: ${getFontSize() - 2}px;
  padding: 4px 6px;
  margin: 0;
  border-bottom: ${({ isExpanded }) =>
    isExpanded ? `0.5px solid ${lightGray}80` : "inherit"};
`;

export interface StepContainerPreToolbarProps {
  codeBlockContent: string;
  language: string;
  filepath: string;
  isGeneratingCodeBlock: boolean;
  codeBlockIndex: number; // To track which codeblock we are applying
  range?: string;
  children: any;
}

export default function StepContainerPreToolbar(
  props: StepContainerPreToolbarProps,
) {
  const ideMessenger = useContext(IdeMessengerContext);
  const streamIdRef = useRef<string>(uuidv4());
  const wasGeneratingRef = useRef(props.isGeneratingCodeBlock);
  const isInEditMode = useAppSelector(
    (state) => state.editModeState.isInEditMode,
  );
  const active = useAppSelector((state) => state.session.isStreaming);
  const [isExpanded, setIsExpanded] = useState(isInEditMode ? false : true);
  const [codeBlockContent, setCodeBlockContent] = useState("");
  const isChatActive = useAppSelector((state) => state.session.isStreaming);

  const nextCodeBlockIndex = useAppSelector(
    (state) => state.session.codeBlockApplyStates.curIndex,
  );

  const applyState = useAppSelector((state) =>
    selectApplyStateBySessionId(state, streamIdRef.current),
  );

  // This handles an edge case when the last node in the markdown syntax tree is a codeblock.
  // In this scenario, `isGeneratingCodeBlock` is never set to false since we determine if
  // we are done generating based on whether the next node in the tree is not a codeblock.
  // The tree parsing logic for Remark is defined on page load, so we can't access state
  // during the actual tree parsing.
  const isGeneratingCodeBlock = !isChatActive
    ? false
    : props.isGeneratingCodeBlock;

  const isNextCodeBlock = nextCodeBlockIndex === props.codeBlockIndex;
  const hasFileExtension = /\.[0-9a-z]+$/i.test(props.filepath);

  const defaultModel = useAppSelector(selectDefaultModel);

  function onClickApply() {
    ideMessenger.post("applyToFile", {
      streamId: streamIdRef.current,
      filepath: props.filepath,
      text: codeBlockContent,
      curSelectedModelTitle: defaultModel.title,
    });
  }

  // Handle apply keyboard shortcut
  useWebviewListener(
    "applyCodeFromChat",
    async () => onClickApply(),
    [isNextCodeBlock, codeBlockContent],
    !isNextCodeBlock,
  );

  useEffect(() => {
    if (codeBlockContent === "") {
      setCodeBlockContent(childrenToText(props.children.props.children));
    } else {
      const debouncedEffect = debounce(() => {
        setCodeBlockContent(childrenToText(props.children.props.children));
      }, 100);

      debouncedEffect();

      return () => {
        debouncedEffect.cancel();
      };
    }
  }, [props.children, codeBlockContent]);

  useEffect(() => {
    const hasCompletedGenerating =
      wasGeneratingRef.current && !isGeneratingCodeBlock;
    const shouldAutoApply = hasCompletedGenerating && isInEditMode;

    if (shouldAutoApply) {
      onClickApply();
    }

    wasGeneratingRef.current = isGeneratingCodeBlock;
  }, [isGeneratingCodeBlock]);

  function onClickAcceptApply() {
    ideMessenger.post("acceptDiff", {
      filepath: props.filepath,
      streamId: streamIdRef.current,
    });
  }

  function onClickRejectApply() {
    ideMessenger.post("rejectDiff", {
      filepath: props.filepath,
      streamId: streamIdRef.current,
    });
  }

  function onClickExpand() {
    setIsExpanded(!isExpanded);
  }

  // We want until there is an extension in the filepath to avoid rendering
  // an incomplete filepath
  if (!hasFileExtension) {
    return props.children;
  }

  return (
    <TopDiv active={active}>
      <ToolbarDiv isExpanded={isExpanded} className="find-widget-skip">
        <div className="flex min-w-0 max-w-[45%] items-center">
          <ChevronDownIcon
            onClick={onClickExpand}
            className={`h-3.5 w-3.5 shrink-0 cursor-pointer text-gray-400 transition-colors hover:bg-white/10 ${
              isExpanded ? "rotate-0" : "-rotate-90"
            }`}
          />
          <div className="w-full min-w-0">
            <FileInfo filepath={props.filepath} range={props.range} />
          </div>
        </div>

        <div className="flex items-center gap-3 max-sm:gap-1.5">
          {isGeneratingCodeBlock && (
            <GeneratingCodeLoader
              showLineCount={!isExpanded}
              codeBlockContent={codeBlockContent}
            />
          )}

          {!isGeneratingCodeBlock && (
            <>
              <CopyButton text={props.codeBlockContent} />
              <ApplyActions
                applyState={applyState}
                onClickApply={onClickApply}
                onClickAccept={onClickAcceptApply}
                onClickReject={onClickRejectApply}
              />
            </>
          )}
        </div>
      </ToolbarDiv>

      {isExpanded && (
        <div
          className={`overflow-hidden overflow-y-auto ${
            isExpanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {props.children}
        </div>
      )}
    </TopDiv>
  );
}
